for (var i = 1; i <= 15; i = i + 1) {
	if (i mod 3 == 0 and i mod 5 == 0) {
		print("FooBar");
	} else if(i mod 3 == 0) {
		print("Foo");
	} else if(i mod 5 == 0) {
		print("Bar");
	} else {
		print(i);
	}
}
