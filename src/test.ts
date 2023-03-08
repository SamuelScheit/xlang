import fs from "fs";
import { AST } from "./ast";
import { Interpreter } from "./interpreter";
import { Lexer } from "./lexer";
const code = fs.readFileSync(__dirname + "/../test/math.x", "utf8");

// const tokens = new Lexer(code).lex();
// console.log(tokens);

// const ast = new AST(tokens).parse();
// console.dir(ast, { depth: null });

// const interpreter = new Interpreter(ast);
// const result = interpreter.run();

// console.log(result);

const result = new Interpreter(new AST(new Lexer(code).lex()).parse()).run();
console.log(result);
