CC := clang
CXX := clang++
CFLAGS = -Wall
CPPFLAGS = -std=c++11 ${CFLAGS}

generator: generator.cpp base64.cpp
	${CXX} -g -DDEBUG ${CPPFLAGS} $(shell pkg-config --libs cairomm-1.0) $(shell pkg-config --cflags cairomm-1.0) -o generator generator.cpp base64.cpp

generator-release: generator.cpp base64.cpp
	${CXX} ${CPPFLAGS} $(shell pkg-config --libs cairomm-1.0) $(shell pkg-config --cflags cairomm-1.0) -o generator generator.cpp base64.cpp
