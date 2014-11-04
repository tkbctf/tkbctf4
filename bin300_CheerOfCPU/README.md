Cheer of CPU
============

# Question
> Did you hear a cheer of CPU?
> 
> The flag is the SHA-256 checksum of the program's output.
> 
> sample: `ruby -rdigest/sha2 -e 'puts Digest::SHA256.hexdigest("OUTPUT HERE".strip).downcase'`
> 
> [https://s3-ap-northeast-1.amazonaws.com/tkbctf4/cheerofcpu](https://s3-ap-northeast-1.amazonaws.com/tkbctf4/cheerofcpu)

# Notes

## Requirements

### Environment
The question's binary in tkbctf4 is compiled with:

* Mac OS X 10.10 (Yosemite) SDK
* Xcode 6.1

### Library
This program depends on CryptoSwift. Its source code is not included this repository. I use Cryptoswift 0.0.2 release.

[krzyzanowskim/CryptoSwift](https://github.com/krzyzanowskim/CryptoSwift)

Clone the CryptoSwift repository (or download tarball), copy the `*.swift` in `Cryptoswift` directory to the same directory which includes `cheerofcpu.swift`, and:

```
swiftc -sdk /Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX10.10.sdk -module-name cheerofcpu ArrayExtension.swift ByteExtension.swift NSDataExtension.swift StringExtension.swift IntExtension.swift Utils.swift CryptoHashBase.swift ChaCha20.swift Cipher.swift CRC.swift MD5.swift SHA1.swift SHA2.swift Hash.swift cheerofcpu.swift
```

## What is "Cheer of CPU"?

[His tweet about the Swift's syntax for defining a function](https://twitter.com/shi3z/status/473627881055485952)

He said that it is similar to Haskell's syntax...

# Author

Mei Akizuru (@maytheplic)

I won't accept any complaint about the environment required to run this binary, i.e., executable file format or bitness. ;-)

