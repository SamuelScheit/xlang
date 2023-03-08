import { Token, TokenType } from "./types";

export class Lexer {
	private current: number = 0;
	private line: number = 1;
	private column: number = 1;
	private tokens: Token[] = [];
	private start: number = 0;

	constructor(private source: string) {}

	lex(): Token[] {
		while (!this.isAtEnd()) {
			this.start = this.current;
			this.scanToken();
		}

		this.tokens.push({ type: TokenType.EOF, lexeme: "", literal: null, line: this.line, column: this.column });
		return this.tokens;
	}

	private scanToken() {
		const c = this.advance();
		switch (c) {
			case "(":
				return this.addToken(TokenType.LEFT_PAREN);
			case ")":
				return this.addToken(TokenType.RIGHT_PAREN);
			case "{":
				return this.addToken(TokenType.LEFT_BRACE);
			case "}":
				return this.addToken(TokenType.RIGHT_BRACE);
			case ",":
				return this.addToken(TokenType.COMMA);
			case ".":
				return this.addToken(TokenType.DOT);
			case "-":
				return this.addToken(TokenType.MINUS);
			case "+":
				return this.addToken(TokenType.PLUS);
			case ";":
				return this.addToken(TokenType.SEMICOLON);
			case "*":
				return this.addToken(TokenType.STAR);
			case "%":
				return this.addToken(TokenType.MOD);
			case "!":
				return this.addToken(this.match("=") ? TokenType.BANG_EQUAL : TokenType.BANG);
			case "=":
				if (this.match(">")) {
					this.addToken(TokenType.ARROW);
				} else {
					this.addToken(this.match("=") ? TokenType.EQUAL_EQUAL : TokenType.EQUAL);
				}
				return;
			case "<":
				return this.addToken(this.match("=") ? TokenType.LESS_EQUAL : TokenType.LESS);
			case ">":
				return this.addToken(this.match("=") ? TokenType.GREATER_EQUAL : TokenType.GREATER);
			case "/":
				if (this.match("/")) {
					// A comment goes until the end of the line.
					while (this.peek() !== "\n" && !this.isAtEnd()) this.advance();
				} else {
					this.addToken(TokenType.SLASH);
				}
				return;
			case " ":
			case "\r":
			case "\t":
				return; // Ignore whitespace.
			case "\n":
				this.line++;
				return (this.column = 1);
			case '"':
				return this.string();
			default:
				if (this.isDigit(c)) {
					this.number();
				} else if (this.isAlpha(c)) {
					this.identifier();
				} else {
					throw new Error(`Unexpected character at line ${this.line} and column ${this.column}`);
				}
		}
	}

	private isDigit(c: string) {
		return c >= "0" && c <= "9";
	}

	private isAlpha(c: string) {
		return (c >= "a" && c <= "z") || (c >= "A" && c <= "Z") || c === "_";
	}

	private isAlphaNumeric(c: string) {
		return this.isAlpha(c) || this.isDigit(c);
	}

	private identifier() {
		while (this.isAlphaNumeric(this.peek())) this.advance();

		// See if the identifier is a reserved word.
		const text = this.source.substring(this.start, this.current);
		const type = TokenType[text.toUpperCase() as keyof typeof TokenType] ?? TokenType.IDENTIFIER;
		this.addToken(type);
	}

	private number() {
		while (this.isDigit(this.peek())) this.advance();

		// Look for a fractional part.
		if (this.peek() === "." && this.isDigit(this.peekNext())) {
			// Consume the "."
			this.advance();

			while (this.isDigit(this.peek())) this.advance();
		}

		this.addToken(TokenType.NUMBER, parseFloat(this.source.substring(this.start, this.current)));
	}

	private string() {
		while (this.peek() !== '"' && !this.isAtEnd()) {
			if (this.peek() === "\n") this.line++;
			this.advance();
		}

		// Unterminated string.
		if (this.isAtEnd()) {
			throw new Error(`Unterminated string at line ${this.line} and column ${this.column}`);
		}

		// The closing ".
		this.advance();

		// Trim the surrounding quotes.
		const value = this.source.substring(this.start + 1, this.current - 1);
		this.addToken(TokenType.STRING, value);
	}

	private match(expected: string) {
		if (this.isAtEnd()) return false;
		if (this.source.charAt(this.current) !== expected) return false;

		this.current++;
		return true;
	}

	private peek() {
		if (this.isAtEnd()) return "\0";
		return this.source.charAt(this.current);
	}

	private peekNext() {
		if (this.current + 1 >= this.source.length) return "\0";
		return this.source.charAt(this.current + 1);
	}

	private isAtEnd() {
		return this.current >= this.source.length;
	}

	private advance() {
		this.current++;
		this.column++;
		return this.source.charAt(this.current - 1);
	}

	private addToken(type: TokenType, literal?: any) {
		const text = this.source.substring(this.start, this.current);
		this.tokens.push({
			type,
			lexeme: text,
			literal,
			line: this.line,
			column: this.column,
		});
	}
}
