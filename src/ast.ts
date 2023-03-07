import {
	AssignmentExpression,
	BinaryExpression,
	BlockStatement,
	CallExpression,
	Expression,
	ExpressionStatement,
	ForStatement,
	GroupingExpression,
	IfStatement,
	LiteralExpression,
	LogicalExpression,
	ReturnStatement,
	Token,
	TokenType,
	UnaryExpression,
	IdentifierExpression,
	VariableStatement,
	WhileStatement,
	FunctionStatement,
} from "./types";

export class AST {
	private tokens: Token[];
	private current: number = 0;

	constructor(tokens: Token[]) {
		this.tokens = tokens;
	}

	public parse() {
		const statements = [];
		while (!this.isAtEnd()) {
			statements.push(this.statement());
		}
		return statements;
	}

	private statement() {
		if (this.match(TokenType.VAR)) {
			return this.declaration();
		}
		if (this.match(TokenType.IF)) {
			return this.ifStatement();
		}
		if (this.match(TokenType.WHILE)) {
			return this.whileStatement();
		}
		if (this.match(TokenType.FOR)) {
			return this.forStatement();
		}
		if (this.match(TokenType.RETURN)) {
			return this.returnStatement();
		}
		if (this.match(TokenType.LEFT_BRACE)) {
			return this.blockStatement();
		}
		if (this.match(TokenType.FUN)) {
			return this.functionStatement();
		}
		return this.expressionStatement();
	}

	private primary(): Expression {
		if (this.match(TokenType.FALSE)) return { type: "literal", value: false } as LiteralExpression;
		if (this.match(TokenType.TRUE)) return { type: "literal", value: true } as LiteralExpression;
		if (this.match(TokenType.NULL)) return { type: "literal", value: null } as LiteralExpression;
		if (this.match(TokenType.NUMBER, TokenType.STRING)) {
			return { type: "literal", value: this.previous().literal } as LiteralExpression;
		}
		if (this.match(TokenType.IDENTIFIER)) {
			return { type: "identifier", name: this.previous() } as IdentifierExpression;
		}
		if (this.match(TokenType.LEFT_PAREN)) {
			const expression = this.expression();
			this.consume(TokenType.RIGHT_PAREN, "Expected ')' after expression.");
			return { type: "grouping", expression } as GroupingExpression;
		}
		if (this.match(TokenType.FUN)) {
			// return this.functionExpression();
		}
		throw this.error(this.peek(), "Expected expression.");
	}

	private match(...types: TokenType[]) {
		for (const type of types) {
			if (this.check(type)) {
				this.advance();
				return true;
			}
		}
		return false;
	}

	private consume(type: TokenType, message: string) {
		if (this.check(type)) {
			return this.advance();
		}

		throw this.error(this.peek(), message);
	}

	private check(type: TokenType) {
		if (this.isAtEnd()) {
			return false;
		}
		return this.peek().type === type;
	}

	private advance() {
		if (!this.isAtEnd()) {
			this.current++;
		}
		return this.previous();
	}

	private isAtEnd() {
		return this.peek().type === TokenType.EOF;
	}

	private peek() {
		return this.tokens[this.current];
	}

	private previous() {
		return this.tokens[this.current - 1];
	}

	private error(token: Token, message: string) {
		console.error(`[line ${token.line}, col ${token.column}] Error at '${token.lexeme}': ${message}`);
		return new Error();
	}

	private declaration(): VariableStatement {
		const name = this.consume(TokenType.IDENTIFIER, "Expected name.");

		let initializer = null;
		if (this.match(TokenType.EQUAL)) {
			initializer = this.expression();
		}

		this.consume(TokenType.SEMICOLON, "Expected ';' after declaration.");
		return { type: "variable", name, initializer };
	}

	private ifStatement(): IfStatement {
		this.consume(TokenType.LEFT_PAREN, "Expected '(' after 'if'.");
		const condition = this.expression();
		this.consume(TokenType.RIGHT_PAREN, "Expected ')' after if condition.");

		const thenBranch = this.statement();
		let elseBranch = null;
		if (this.match(TokenType.ELSE)) {
			elseBranch = this.statement();
		}

		return { type: "if", condition, thenBranch, elseBranch };
	}

	private whileStatement(): WhileStatement {
		this.consume(TokenType.LEFT_PAREN, "Expected '(' after 'while'.");
		const condition = this.expression();
		this.consume(TokenType.RIGHT_PAREN, "Expected ')' after while condition.");

		const body = this.statement();

		return { type: "while", condition, body };
	}

	private forStatement(): ForStatement {
		this.consume(TokenType.LEFT_PAREN, "Expected '(' after 'for'.");

		let initializer = null;
		if (this.match(TokenType.SEMICOLON)) {
			initializer = null;
		} else if (this.match(TokenType.VAR)) {
			initializer = this.declaration();
		} else {
			initializer = this.expressionStatement();
		}

		let condition = null;
		if (!this.check(TokenType.SEMICOLON)) {
			condition = this.expression();
		}
		this.consume(TokenType.SEMICOLON, "Expected ';' after loop condition.");

		let increment = null;
		if (!this.check(TokenType.RIGHT_PAREN)) {
			increment = this.expression();
		}
		this.consume(TokenType.RIGHT_PAREN, "Expected ')' after for clauses.");

		let body = this.statement();

		return { type: "for", initializer, condition, increment, body };
	}

	private functionStatement(): FunctionStatement {
		const params = [];
		const name = this.consume(TokenType.IDENTIFIER, "Expected function name.");
		this.consume(TokenType.LEFT_PAREN, "Expected '(' after function name.");

		if (!this.check(TokenType.RIGHT_PAREN)) {
			do {
				params.push(this.consume(TokenType.IDENTIFIER, "Expected parameter name."));
			} while (this.match(TokenType.COMMA));
		}

		this.consume(TokenType.RIGHT_PAREN, "Expected ')' after function parameters.");

		this.consume(TokenType.LEFT_BRACE, "Expected '{' before function body.");
		const body = this.blockStatement();
		return { type: "function", name, params, body };
	}

	private returnStatement(): ReturnStatement {
		const keyword = this.previous();
		let value = null;
		if (!this.check(TokenType.SEMICOLON)) {
			value = this.expression();
		}

		this.consume(TokenType.SEMICOLON, "Expected ';' after return value.");
		return { type: "return", keyword, value };
	}

	private blockStatement() {
		const statements = [];

		while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
			statements.push(this.expressionStatement());
		}

		this.consume(TokenType.RIGHT_BRACE, "Expected '}' after block.");
		return { type: "block", statements } as BlockStatement;
	}

	private expressionStatement(): ExpressionStatement {
		const expression = this.expression();
		this.consume(TokenType.SEMICOLON, "Expected ';' after expression.");
		return { type: "expression", expression };
	}

	private expression() {
		return this.assignment();
	}

	private assignment(): Expression {
		const expression = this.or();
		if (this.match(TokenType.EQUAL)) {
			const equals = this.previous();
			const value = this.assignment();
			if (expression.type === "identifier") {
				return { type: "assignment", name: expression.name, value } as AssignmentExpression;
			}
			this.error(equals, "Invalid assignment target.");
		}
		return expression;
	}

	private or(): Expression {
		let expression = this.and();
		while (this.match(TokenType.OR)) {
			const operator = this.previous();
			const right = this.and();
			expression = { type: "logical", operator, left: expression, right } as LogicalExpression;
		}
		return expression;
	}

	private and(): Expression {
		let expression = this.equality();
		while (this.match(TokenType.AND)) {
			const operator = this.previous();
			const right = this.equality();
			expression = { type: "logical", operator, left: expression, right } as LogicalExpression;
		}
		return expression;
	}

	private equality(): Expression {
		let expression = this.comparison();
		while (this.match(TokenType.BANG_EQUAL, TokenType.EQUAL_EQUAL)) {
			const operator = this.previous();
			const right = this.comparison();
			expression = { type: "binary", operator, left: expression, right } as BinaryExpression;
		}
		return expression;
	}

	private comparison(): Expression {
		let expression = this.term();
		while (this.match(TokenType.GREATER, TokenType.GREATER_EQUAL, TokenType.LESS, TokenType.LESS_EQUAL)) {
			const operator = this.previous();
			const right = this.term();
			expression = { type: "binary", operator, left: expression, right } as BinaryExpression;
		}
		return expression;
	}

	private term(): Expression {
		let expression = this.factor();
		while (this.match(TokenType.PLUS, TokenType.MINUS)) {
			const operator = this.previous();
			const right = this.factor();
			expression = { type: "binary", operator, left: expression, right } as BinaryExpression;
		}
		return expression;
	}

	private factor(): Expression {
		let expression = this.preUnary();
		while (this.match(TokenType.STAR, TokenType.SLASH, TokenType.MOD)) {
			const operator = this.previous();
			const right = this.preUnary();
			expression = { type: "binary", operator, left: expression, right } as BinaryExpression;
		}
		return expression;
	}

	private preUnary(): Expression {
		const right = this.primary();
		if (this.match(TokenType.INCREMENT, TokenType.DECREMENT)) {
			const operator = this.previous();
			return { type: "unary", operator, right } as UnaryExpression;
		}
		return this.unary();
	}

	private unary(): Expression {
		if (this.match(TokenType.BANG, TokenType.MINUS, TokenType.PLUS, TokenType.INCREMENT, TokenType.DECREMENT)) {
			const operator = this.previous();
			const right = this.unary();
			return { type: "unary", operator, right } as UnaryExpression;
		}
		return this.call();
	}

	private call() {
		let expression = this.primary();
		while (true) {
			if (this.match(TokenType.LEFT_PAREN)) {
				expression = this.finishCall(expression);
			} else {
				break;
			}
		}
		return expression;
	}

	private finishCall(callee: Expression) {
		const args = [];
		if (!this.check(TokenType.RIGHT_PAREN)) {
			do {
				args.push(this.expression());
			} while (this.match(TokenType.COMMA));
		}
		this.consume(TokenType.RIGHT_PAREN, "Expected ')' after arguments.");
		return { type: "call", callee, args } as CallExpression;
	}
}
