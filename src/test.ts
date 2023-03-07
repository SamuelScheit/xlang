import fs from "fs";
import { AST } from "./ast";
import { Lexer } from "./lexer";
const code = fs.readFileSync(__dirname + "/../test/input.x", "utf8");

const tokens = new Lexer(code).lex();
console.log(tokens);

const ast = new AST(tokens).parse();
console.dir(ast, { depth: null });
