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
	CLASS,
	ELSE,
	FALSE,
	FOR,
	IF,
	NULL,
	OR,
	RETURN,
	SUPER,
	THIS,
	TRUE,
	VAR,
	WHILE,
	MOD,

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
	FUN,
}

export class Token {
	constructor(public type: TokenType, public lexeme: string, public literal: any, public line: number, public column: number) {}
}

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

		this.tokens.push(new Token(TokenType.EOF, "", null, this.line, this.column));
		return this.tokens;
	}

	private scanToken() {
		const c = this.advance();
		switch (c) {
			case "(":
				this.addToken(TokenType.LEFT_PAREN);
				break;
			case ")":
				this.addToken(TokenType.RIGHT_PAREN);
				break;
			case "{":
				this.addToken(TokenType.LEFT_BRACE);
				break;
			case "}":
				this.addToken(TokenType.RIGHT_BRACE);
				break;
			case ",":
				this.addToken(TokenType.COMMA);
				break;
			case ".":
				this.addToken(TokenType.DOT);
				break;
			case "-":
				this.addToken(TokenType.MINUS);
				break;
			case "+":
				this.addToken(TokenType.PLUS);
				break;
			case ";":
				this.addToken(TokenType.SEMICOLON);
				break;
			case "*":
				this.addToken(TokenType.STAR);
				break;
			case "%":
				this.addToken(TokenType.MOD);
				break;
			case "!":
				this.addToken(this.match("=") ? TokenType.BANG_EQUAL : TokenType.BANG);
				break;
			case "=":
				this.addToken(this.match("=") ? TokenType.EQUAL_EQUAL : TokenType.EQUAL);
				break;
			case "<":
				this.addToken(this.match("=") ? TokenType.LESS_EQUAL : TokenType.LESS);
				break;
			case ">":
				this.addToken(this.match("=") ? TokenType.GREATER_EQUAL : TokenType.GREATER);
				break;
			case "/":
				if (this.match("/")) {
					// A comment goes until the end of the line.
					while (this.peek() !== "\n" && !this.isAtEnd()) this.advance();
				} else {
					this.addToken(TokenType.SLASH);
				}
				break;
			case " ":
			case "\r":
			case "\t":
				// Ignore whitespace.
				break;
			case "\n":
				this.line++;
				this.column = 1;
				break;
			case '"':
				this.string();
				break;
			default:
				if (this.isDigit(c)) {
					this.number();
				} else if (this.isAlpha(c)) {
					this.identifier();
				} else {
					throw new Error(`Unexpected character at line ${this.line} and column ${this.column}`);
				}
				break;
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
		this.tokens.push(new Token(type, text, literal, this.line, this.column));
	}
}
