#!/usr/bin/env node --no-warnings --experimental-strip-types
import { program } from "./command.ts";

program.parse(process.argv);
