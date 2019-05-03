#!/usr/bin/env python3

import sys
import argparse

parser = argparse.ArgumentParser(description="localize: clean and smudge filter.")
parser.add_argument("mode", nargs=1, choices=['clean', 'smudge'], help='The mode of the localization.')
parser.add_argument("local", nargs=1, help='The top level directory of the git repository.')

arguments = parser.parse_args()
mode = arguments.mode[0]
local = arguments.local[0]

def clean(local):
    for line in sys.stdin:
        sys.stdout.write(line.replace(local, 'https://raw.githubusercontent.com/NSSAC/EpiHiper-Schema/master'))
    
def smudge(local):
    for line in sys.stdin:
        sys.stdout.write(line.replace('https://raw.githubusercontent.com/NSSAC/EpiHiper-Schema/master', local))
    
{'clean': clean, 'smudge': smudge}[mode](local)
