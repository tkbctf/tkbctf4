#include <cstdio>
#include <cstdlib>
#include <unistd.h>
#include <ctime>
#include <cmath>
#include <iostream>
#include <vector>
#include <algorithm>
#include <string>
#include <cairomm/cairomm.h>
#include "random.h"
#include "base64.h"

using namespace std;

struct HorizontalLine {
    int begin_line;
    int y;
};

struct Options {
    bool is_waved = false;
    bool is_rotated = false;
    int num_vertical_lines = 4;
};

enum struct PNGEndStatus {
    Running,
    IENDSize,
    IENDType,
    IENDCRC
};

constexpr int MaxNumberOfVerticalLines = 8;
constexpr int ImageWidth = 600;
constexpr int ImageHeight = 600;
constexpr int VerticalMargin = 150;
constexpr int FontSize = 18;
constexpr unsigned int initialBufferSize = 1024;

Cairo::RefPtr<Cairo::Context> cr;

int rand_range(const int min, const int max);
void ParseArguments(Options& opts, int argc, char * const argv[]);
void Rotate(const double rotate_angle);
void DrawVerticalLines(const int num_vertical_lines, const double interval);
void DrawHorizontalLine(const double x1, const double y1, const double x2, const double y2, const bool is_waved);
int solve(const int goal, const int num_horizontal_lines, const vector<vector<bool>> table);
Cairo::ErrorStatus ImageWriter(const unsigned char* data, unsigned int length);

unsigned char *buffer;
unsigned int bufsize = 0;
unsigned int bufpos = 0;
bool is_file_finished = false;
PNGEndStatus pngEndStatus = PNGEndStatus::Running;

int main(int argc, char * const argv[])
{
    // parse opt
    Options opts;
    ParseArguments(opts, argc, argv);
#if DEBUG
    printf("waved  :  %s\n", opts.is_waved ? "enabled" : "disabled");
    printf("rotated:  %s\n", opts.is_rotated ? "enabled" : "disabled");
    printf("num_vert: %d\n", opts.num_vertical_lines);
#endif

    const double VerticalLineInterval = (double)ImageWidth / (opts.num_vertical_lines + 1);

    // initialize RNG
    unsigned int seed = time(NULL);
    init_genrand(seed);
#if DEBUG
    printf("Initialized with seed: %d\n", seed);
#endif

    auto surface = Cairo::ImageSurface::create(Cairo::Format::FORMAT_ARGB32, ImageWidth, ImageHeight);
    cr = Cairo::Context::create(surface);

    cr->set_source_rgb(1.0, 1.0, 1.0);
    cr->paint();

    if (opts.is_rotated) {
        auto rotate_angle = genrand_real1() * M_PI * 2.0;
#if DEBUG
        printf("Rotate angle: %f\n", rotate_angle);
#endif
        Rotate(rotate_angle);
    }

    DrawVerticalLines(opts.num_vertical_lines, VerticalLineInterval);

    // Generate horizontal lines
    const int num_horizontal_lines = rand_range(20, 30);
    vector<vector<bool>> amida(ImageHeight, vector<bool>(num_horizontal_lines));
    for (int i = 0; i < ImageHeight; ++i) {
        for (int j = 0; j < num_horizontal_lines; ++j) {
            amida[i][j] = false;
        }
    }
    for (int i = 0; i < num_horizontal_lines; ++i) {
        HorizontalLine hline = {
                rand_range(1, opts.num_vertical_lines - 1),
                rand_range(VerticalMargin + 10, ImageHeight - VerticalMargin - 10)
        };

        bool flag = true;
        const int bottom_limit = min(ImageHeight - VerticalMargin, hline.y + 10);
        const int right_limit = min(num_horizontal_lines - 1, hline.begin_line + 1);
        for (int j = max(0, hline.y - 10); j <= bottom_limit; ++j) {
            for (int k = max(1, hline.begin_line - 1); k <= right_limit; ++k) {
                if (amida[j][k]) {
                    flag = false;
                    break;
                }
            }
            if (!flag) {
                break;
            }
        }
        if (!flag) {
            continue;
        }
        amida[hline.y][hline.begin_line] = true;
#if DEBUG
        printf("%d hline = (%f, %f) - (%f, %f)\n", i,
                hline.begin_line * VerticalLineInterval, (double)hline.y,
                (hline.begin_line + 1) * VerticalLineInterval, (double)hline.y);
#endif
        DrawHorizontalLine(
                hline.begin_line * VerticalLineInterval, hline.y,
                (hline.begin_line + 1) * VerticalLineInterval, hline.y,
                opts.is_waved);
    }

    const int goal = rand_range(1, opts.num_vertical_lines);
    int answer = solve(goal, num_horizontal_lines, amida);
#if DEBUG
    printf("Goal:   %d\n", goal);
    printf("Answer: %d\n", answer);
#endif
    // Draw goal
    cr->arc(goal * VerticalLineInterval, ImageHeight - VerticalMargin + 20, 10, 0, 2 * M_PI);
    cr->fill();

#if DEBUG
    surface->write_to_png("out.png");
#endif
    surface->write_to_png_stream(sigc::ptr_fun(ImageWriter));
    string encoded = base64_encode(buffer, bufpos);

    // Output case
    printf("problem: %s\n", encoded.c_str());
    printf("answer: %d\n", answer);

    return 0;
}

int rand_range(const int min, const int max)
{
    return genrand_int32() % (max - min + 1) + min;
}

void ParseArguments(Options& opts, int argc, char * const argv[])
{
    int optchar;
    while ((optchar = getopt(argc, argv, "wrn:")) != -1) {
        switch (optchar) {
            case 'n':
#if DEBUG
                fprintf(stdout, "%c %s\n", optchar, optarg);
#endif
                opts.num_vertical_lines = atoi(optarg);
                break;
            case 'r':
                opts.is_rotated = true;
                break;
            case 'w':
                opts.is_waved = true;
                break;
            default:
                exit(EXIT_FAILURE);
        }
    }
    if (opts.num_vertical_lines <= 0) {
        fprintf(stderr, "vertical lines should be larger than 0\n");
        exit(EXIT_FAILURE);
    }
    if (MaxNumberOfVerticalLines < opts.num_vertical_lines) {
        fprintf(stderr, "too many vertical lines\n");
        exit(EXIT_FAILURE);
    }
}

void Rotate(const double rotate_angle)
{
    cr->translate(ImageWidth / 2, ImageHeight / 2);
    cr->rotate(rotate_angle);
    cr->translate(-ImageWidth / 2, -ImageHeight / 2);
}

void DrawVerticalLines(const int num_vertical_lines, const double interval)
{
    // Initialize color
    cr->set_source_rgb(0.0, 0.0, 0.0);

    // Set line width for vertical lines
    cr->set_line_width(2);

    // Setup for showing text
    cr->select_font_face("sans-serif", Cairo::FontSlant::FONT_SLANT_NORMAL, Cairo::FontWeight::FONT_WEIGHT_NORMAL);
    cr->set_font_size(FontSize);

    for (int i = 1; i <= num_vertical_lines; ++i) {
        cr->move_to(i * interval, VerticalMargin);
        cr->line_to(i * interval, ImageHeight - VerticalMargin);
        cr->stroke();
        cr->move_to(i * interval - (FontSize / 2), VerticalMargin - FontSize);
        cr->show_text(string(1, '0' + i));
    }
}

void DrawHorizontalLine(const double x1, const double y1, const double x2, const double y2, const bool is_waved)
{
    cr->move_to(x1, y1);
    if (is_waved) {
        const double mid_point = (x1 + x2) / 2.0;
        cr->curve_to(mid_point, y1 + 25, mid_point, y1 - 25, x2, y2);
    } else {
        cr->line_to(x2, y2);
    }
    cr->stroke();
}

int solve(const int goal, const int num_horizontal_lines, const vector<vector<bool>> table)
{
    int ans[num_horizontal_lines];
    for (int i = 0; i < num_horizontal_lines; ++i) {
        ans[i] = i + 1;
    }
    for (int i = 0; i < ImageHeight; ++i) {
        for (int j = 0; j < num_horizontal_lines; ++j) {
            if (table[i][j]) {
                swap(ans[j - 1], ans[j]);
            }
        }
    }
    return ans[goal - 1];
}

Cairo::ErrorStatus ImageWriter(const unsigned char* data, unsigned int length)
{
    const unsigned int requiredSize = bufpos + length;
    if (bufsize == 0) {
        buffer = (unsigned char *)malloc(sizeof(unsigned char) * initialBufferSize);
        bufsize = initialBufferSize;
#if DEBUG
        printf("initial allocation: %d\n", bufsize);
#endif
    }
    while (bufsize < requiredSize) {
#if DEBUG
        printf("reallocate: %d -> %d\n", bufsize, bufsize * 2);
#endif
        buffer = (unsigned char *)realloc(buffer, bufsize * 2);
        bufsize *= 2;
    }
    if (!buffer) {
        fprintf(stderr, "cannot allocate memory\n");
        exit(EXIT_FAILURE);
    }
    memcpy(buffer + bufpos, data, length);
    bufpos += length;
    return CAIRO_STATUS_SUCCESS;
}
