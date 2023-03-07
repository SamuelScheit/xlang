export type Expression =
	| LiteralExpression
	| UnaryExpression
	| BinaryExpression
	| GroupingExpression
	| IdentifierExpression
	| AssignmentExpression
	| LogicalExpression
	| CallExpression
	| FunctionExpression;

export interface LiteralExpression {
	value: any;
	type: "literal";
}

export interface UnaryExpression {
	operator: Token;
	right: Expression;
	type: "unary";
}

export interface BinaryExpression {
	left: Expression;
	operator: Token;
	right: Expression;
	type: "binary";
}

export interface GroupingExpression {
	expression: Expression;
	type: "grouping";
}

export interface IdentifierExpression {
	name: Token;
	type: "identifier";
}

export interface AssignmentExpression {
	name: Token;
	value: Expression;
	type: "assignment";
}

export interface LogicalExpression {
	left: Expression;
	operator: Token;
	right: Expression;
	type: "logical";
}

export interface CallExpression {
	callee: Expression;
	args: Expression[];
	type: "call";
}

export interface FunctionExpression {
	name: Token | null;
	params: Token[];
	body: BlockStatement;
	type: "arrow_function";
}

export interface ExpressionStatement {
	expression: Expression;
	type: "expression";
}

export interface VariableStatement {
	name: Token;
	initializer: Expression | null;
	type: "variable";
}

export interface BlockStatement {
	statements: Statement[];
	type: "block";
}

export interface IfStatement {
	condition: Expression;
	thenBranch: Statement;
	elseBranch: Statement | null;
	type: "if";
}

export interface WhileStatement {
	condition: Expression;
	body: Statement;
	type: "while";
}

export interface ForStatement {
	initializer: VariableStatement | ExpressionStatement | null;
	condition: Expression | null;
	increment: Expression | null;
	body: Statement;
	type: "for";
}

export interface ReturnStatement {
	keyword: Token;
	value: Expression | null;
	type: "return";
}

export interface FunctionStatement {
	name: Token;
	params: Token[];
	body: BlockStatement;
	type: "function";
}

export type Statement =
	| ExpressionStatement
	| VariableStatement
	| BlockStatement
	| IfStatement
	| WhileStatement
	| ForStatement
	| ReturnStatement
	| FunctionStatement;

export interface Token {
	type: TokenType;
	lexeme: string;
	literal: any;
	line: number;
	column: number;
}

export enum TokenType {
	EOF,
	// equality
	BANG,
	BANG_EQUAL,
	EQUAL,
	EQUAL_EQUAL,
	GREATER,
	GREATER_EQUAL,
	LESS,
	LESS_EQUAL,

	// Literals.
	IDENTIFIER,
	STRING,
	NUMBER,

	// Keywords.
	AND,
	ELSE,
	FALSE,
	FOR,
	IF,
	NULL,
	OR,
	RETURN,
	THIS,
	TRUE,
	VAR,
	WHILE,
	MOD,
	ARROW,
	FUN,

	// Single-character tokens.
	LEFT_PAREN,
	RIGHT_PAREN,
	LEFT_BRACE,
	RIGHT_BRACE,
	COMMA,
	DOT,
	MINUS,
	PLUS,
	SEMICOLON,
	SLASH,
	STAR,

	//
	INCREMENT,
	DECREMENT,
}
