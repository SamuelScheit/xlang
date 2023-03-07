import { Token, TokenType } from "./lexer";

export class Binary {
	constructor(public left: Expr, public operator: Token, public right: Expr) {}
}

export class Grouping {
	constructor(public expression: Expr) {}
}

export class Literal {
	constructor(public value: any) {}
}

export class Unary {
	constructor(public operator: Token, public right: Expr) {}
}

export type Expr = Binary | Grouping | Literal | Unary | null;
export type Stmt = null;

export class AST {
	private tokens: Token[];
	private current: number = 0;

	constructor(tokens: Token[]) {
		this.tokens = tokens;
	}

	parse(): Expr {
		try {
			return this.expression();
		} catch (error) {
			this.synchronize();
			return null;
		}
	}

	private expression(): Expr {
		return this.equality();
	}

	private equality(): Expr {
		let expr = this.comparison();

		while (this.match(TokenType.BANG_EQUAL, TokenType.EQUAL_EQUAL)) {
			const operator = this.previous();
			const right = this.comparison();
			expr = new Binary(expr, operator, right);
		}

		return expr;
	}

	private comparison(): Expr {
		let expr = this.term();

		while (this.match(TokenType.GREATER, TokenType.GREATER_EQUAL, TokenType.LESS, TokenType.LESS_EQUAL)) {
			const operator = this.previous();
			const right = this.term();
			expr = new Binary(expr, operator, right);
		}

		return expr;
	}

	private term(): Expr {
		let expr = this.factor();

		while (this.match(TokenType.MINUS, TokenType.PLUS)) {
			const operator = this.previous();
			const right = this.factor();
			expr = new Binary(expr, operator, right);
		}

		return expr;
	}

	private factor(): Expr {
		let expr = this.unary();

		while (this.match(TokenType.SLASH, TokenType.STAR, TokenType.MOD)) {
			const operator = this.previous();
			const right = this.unary();
			expr = new Binary(expr, operator, right);
		}

		return expr;
	}

	private unary(): Expr {
		if (this.match(TokenType.BANG, TokenType.MINUS)) {
			const operator = this.previous();
			const right = this.unary();
			return new Unary(operator, right);
		}

		return this.primary();
	}

	private primary(): Expr {
		if (this.match(TokenType.FALSE)) return new Literal(false);
		if (this.match(TokenType.TRUE)) return new Literal(true);
		if (this.match(TokenType.NULL)) return new Literal(null);

		if (this.match(TokenType.NUMBER, TokenType.STRING)) {
			return new Literal(this.previous().literal);
		}

		if (this.match(TokenType.LEFT_PAREN)) {
			const expr = this.expression();
			this.consume(TokenType.RIGHT_PAREN, "Expect ')' after expression.");
			return new Grouping(expr);
		}
		if (this.match(TokenType.FOR)) {
			return this.forExpression();
		}

		throw this.error(this.peek(), "Expect expression.");
	}

	private forExpression(): Expr {
		this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'for'.");
		const initializer = this.match(TokenType.SEMICOLON) ? null : this.varDeclaration() || this.expression();
		const condition = this.check(TokenType.SEMICOLON) ? null : this.expression();
		this.consume(TokenType.SEMICOLON, "Expect ';' after loop condition.");
		const increment = this.check(TokenType.RIGHT_PAREN) ? null : this.expression();
		this.consume(TokenType.RIGHT_PAREN, "Expect ')' after for clauses.");

		let body = this.statement();

		if (increment !== null) {
			body = new Block([body, new Expression(increment)]);
		}

		if (condition === null) {
			condition = new Literal(true);
		}

		body = new While(condition, body);

		if (initializer !== null) {
			body = new Block([initializer, body]);
		}

		return body;
	}

	private varDeclaration(): Stmt | null {
		if (this.match(TokenType.VAR)) {
			const name = this.consume(TokenType.IDENTIFIER, "Expect variable name.");
			let initializer = null;
			if (this.match(TokenType.EQUAL)) {
				initializer = this.expression();
			}
			this.consume(TokenType.SEMICOLON, "Expect ';' after variable declaration.");
			return new Var(name, initializer);
		}
		return null;
	}

	private expressionStatement(): Stmt {
		const expr = this.expression();
		this.consume(TokenType.SEMICOLON, "Expect ';' after expression.");
		return new Expression(expr);
	}

	private match(...types: TokenType[]): boolean {
		for (const type of types) {
			if (this.check(type)) {
				this.advance();
				return true;
			}
		}

		return false;
	}

	private consume(type: TokenType, message: string): Token {
		if (this.check(type)) return this.advance();

		throw this.error(this.peek(), message);
	}

	private check(type: TokenType): boolean {
		if (this.isAtEnd()) return false;
		return this.peek().type === type;
	}

	private advance(): Token {
		if (!this.isAtEnd()) this.current++;
		return this.previous();
	}

	private isAtEnd(): boolean {
		return this.peek().type === TokenType.EOF;
	}

	private peek(): Token {
		return this.tokens[this.current];
	}

	private previous(): Token {
		return this.tokens[this.current - 1];
	}

	private error(token: Token, message: string): Error {
		return new Error(`[line ${token.line}] Error at '${token.lexeme}': ${message}`);
	}

	private synchronize(): void {
		this.advance();

		while (!this.isAtEnd()) {
			if (this.previous().type === TokenType.SEMICOLON) return;

			switch (this.peek().type) {
				case TokenType.CLASS:
				case TokenType.FOR:
				case TokenType.IF:
				case TokenType.RETURN:
				case TokenType.VAR:
				case TokenType.WHILE:
					return;
			}

			this.advance();
		}
	}
}
