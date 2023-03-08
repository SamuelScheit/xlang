import { BinaryExpression, Expression, FunctionStatement, Statement, TokenType, UnaryExpression } from "./types";

export class Interpreter {
	constructor(public ast: Statement[], public identifiers: Map<string, any> = new Map()) {
		this.identifiers.set("print", console.log);
	}

	public run() {
		const start = performance.now();
		let result = null;
		for (const statement of this.ast) {
			result = this.statement(statement);
		}
		const end = performance.now();
		console.log("Execution time: " + (end - start) + "ms");
		return result;
	}

	private statement(statement: Statement | null) {
		if (!statement) return;

		switch (statement.type) {
			case "expression":
				return this.expression(statement.expression);
			case "variable":
				this.identifiers.set(statement.name.lexeme, this.expression(statement.initializer));
				break;
			case "block":
				for (const x of statement.statements) {
					this.statement(x);
				}
				break;
			case "if":
				if (this.expression(statement.condition)) {
					this.statement(statement.thenBranch);
				} else if (statement.elseBranch) {
					this.statement(statement.elseBranch);
				}
				break;
			case "while":
				while (this.expression(statement.condition)) {
					this.statement(statement.body);
				}
				break;
			case "for":
				this.statement(statement.initializer);
				while (this.expression(statement.condition)) {
					this.statement(statement.body);
					this.statement(statement.increment);
				}
				break;
			case "function":
				this.identifiers.set(statement.name.lexeme, statement);
				break;
			case "return":
				return this.expression(statement.value);
		}
	}

	private expression(expression: Expression | null): any {
		if (!expression) return null;

		switch (expression.type) {
			case "binary":
				return this.binary(expression);
			case "grouping":
				return this.expression(expression.expression);
			case "literal":
				return expression.value;
			case "unary":
				return this.unary(expression);
			case "identifier":
				if (!this.identifiers.has(expression.name.lexeme)) throw new Error("Variable not found: " + expression.name.lexeme);
				return this.identifiers.get(expression.name.lexeme);
			case "assignment":
				const value = this.expression(expression.value);
				this.identifiers.set(expression.name.lexeme, value);
				return value;
			case "call":
				const calle = this.expression(expression.callee);
				const args = expression.args.map((x) => this.expression(x));
				if (!calle) throw new Error("Function not found");
				if (typeof calle === "function") {
					return calle(...args);
				}

				const stack = new Map(this.identifiers);
				for (let i = 0; i < calle.params.length; i++) {
					stack.set(calle.params[i].lexeme, args[i]);
				}
				if (calle.type !== "function") throw new Error("Can only call functions");
				return new Interpreter(calle.body.statements, stack).run();
		}
	}

	private binary(expression: BinaryExpression): any {
		const left = this.expression(expression.left);
		const right = this.expression(expression.right);

		switch (expression.operator.type) {
			case TokenType.MINUS:
				return left - right;
			case TokenType.PLUS:
				return left + right;
			case TokenType.SLASH:
				return left / right;
			case TokenType.STAR:
				return left * right;
			case TokenType.GREATER:
				return left > right;
			case TokenType.GREATER_EQUAL:
				return left >= right;
			case TokenType.LESS:
				return left < right;
			case TokenType.LESS_EQUAL:
				return left <= right;
			case TokenType.BANG_EQUAL:
				return left !== right;
			case TokenType.EQUAL_EQUAL:
				return left === right;
			case TokenType.AND:
				return left && right;
			case TokenType.OR:
				return left || right;
			case TokenType.EQUAL:
				return left === right;
			case TokenType.MOD:
				return left % right;
			default:
				throw new Error("Unknown operator: " + TokenType[expression.operator.type]);
		}
	}

	private unary(expression: UnaryExpression): any {
		const right = this.expression(expression.right);

		switch (expression.operator.type) {
			case TokenType.BANG:
				return !right;
			case TokenType.MINUS:
				return -right;
		}
	}
}
