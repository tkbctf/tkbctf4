amida
=====

misc 400

# Question

> `203.178.132.117:42719`
> 
> [Ghost Leg - Wikipedia, the free encyclopedia](http://en.wikipedia.org/wiki/Ghost_Leg)

Note: 'amida' means 'amidakuji'.

# Notes

The idea of this challenge is taken from "Amidakuji" in [SECCON 2014 Online Qualification Round](http://2014.seccon.jp/summer2014quals.html) (Japanese).

## Requirements / Libraries

This program depends on:

* [cairo](http://cairographics.org/) (2D graphics library)
* [cairomm](http://cairographics.org/cairomm/) (C++ wrapper for cairo)

and includes:

* [C++ base64 encoder](http://www.adp-gmbh.ch/cpp/common/base64.html)
* [Mersenne Twister Random Number Generator](http://www.math.sci.hiroshima-u.ac.jp/~m-mat/MT/emt.html)

Compiling with GCC (`g++`) may be failed. It is known problem and I won't fix it. Therefore, I recommend to use clang (`clang++`).

Tested environments:

* Mac OS X 10.10 (Yosemite) / clang++
* Ubuntu 14.04 LTS / clang++

# Author

* Mei Akizuru (@maytheplic)
* @yuscarlet

