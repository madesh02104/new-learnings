//There are 3 basic types in TypeScript
let isDone: boolean = false;
let lines: number = 42;
let userName: string = "Anders";

// But you can omit the type annotation if the variables are derived
// from explicit literals
let isDone = false;
let lines = 42;
let userName = "Anders";

// When it's impossible to know, there is the "Any" type
let notSure: any = 4;
notSure = "maybe a string instead";
notSure = false; // okay, definitely a boolean

// Use const keyword for constants
const numLivesForCat = 9;
numLivesForCat = 1; // Error

// For collections, there are typed arrays and generic arrays
let list: number[] = [1, 2, 3];
// Alternatively, using the generic array type
let list: Array<number> = [1, 2, 3];

// For enumerations:
enum Color { Red, Green, Blue };
let c: Color = Color.Green;
console.log(Color[c]); // "Green"

enum Direction {
    North = 1,
    South,
    East,
    West
}

console.log(Direction.South); // 2

// Lastly, "void" is used in the special case of a function returning nothing
function bigHorribleAlert(): void {
    console.log('this doesn\'t return anything');
}
bigHorribleAlert();

// The following are equivalent, the same signature will be inferred by the
// compiler, and same JavaScript will be emitted
let f1 = function (i: number): number { return i * i; }
// Return type inferred
let f2 = function (i: number) { return i * i; }
// "Fat arrow" syntax
let f3 = (i: number): number => { return i * i; }
// "Fat arrow" syntax with return type inferred
let f4 = (i: number) => { return i * i; }
// "Fat arrow" syntax with return type inferred, braceless means no return
// keyword needed
let f5 = (i: number) => i * i;
  
console.log(f4(5)); // 25

// Functions can accept more than one type
function f6(i: string | number): void {
    console.log("The value was " + i);
  }
  f6(6); // The value was 6
  f6("six"); // The value was six
f6(true); // Error, boolean is not assignable to string | number

// Interfaces are structural, anything that has the properties is compliant with
// the interface
interface Person {
    name: string;
    // Optional properties, marked with a "?"
    age?: number;
    // And of course functions
    move(): void;
  }
  
  // Object that implements the "Person" interface
  // Can be treated as a Person since it has the name and move properties
  let p: Person = { name: "Bobby", move: () => { } };
  // Objects that have the optional property:
  let validPerson: Person = { name: "Bobby", age: 42, move: () => { } };
  // Is not a person because age is not a number
  let invalidPerson: Person = { name: "Bobby", age: true };

  // Interfaces can also describe a function type
interface SearchFunc {
    (source: string, subString: string): boolean;
  }
  // Only the parameters' types are important, names are not important.
  let mySearch: SearchFunc;
  mySearch = function (src: string, sub: string) {
    return src.search(sub) != -1;
  }
  console.log(mySearch('hello','hell'));

  // Classes - members are public by default
class Point {
    // Properties
    x: number;
  
    // Constructor - the public/private keywords in this context will generate
    // the boiler plate code for the property and the initialization in the
    // constructor.
    // In this example, "y" will be defined just like "x" is, but with less code
    // Default values are also supported
  
    constructor(x: number, public y: number = 0) {
      this.x = x;
    }
  
    // Functions
    dist(): number { return Math.sqrt(this.x * this.x + this.y * this.y); }
  
  }
  
  let p1 = new Point(10, 20);
  let p2 = new Point(25); //y will be 0

  console.log(p1);
  console.log(p2);
  console.log(p1.dist());

  // Inheritance
    class Point3D extends Point {
    constructor(x: number, y: number, public z: number = 0) {
      super(x, y); // Explicit call to the super class constructor is mandatory
    }
  
    // Overwrite
    dist(): number {
      let d = super.dist();
      return Math.sqrt(d * d + this.z * this.z);
    }
  }

//   Template Strings (strings that use backticks)
// String Interpolation with Template Strings
let userName = 'Tyrone';
let greeting = `Hi ${name}, how are you?`
// Multiline Strings with Template Strings
let multiline = `This is an example
of a multiline string`;

// READONLY: New Feature in TypeScript 3.1
interface Person {
  readonly userName: string;
  readonly ageNo: number;
}

var p1: Person = { name: "Tyrone", age: 42 };
p1.age = 25; // Error, p1.age is read-only

var p2 = { name: "John", age: 60 };
var p3: Person = p2; // Ok, read-only alias for p2
p3.age = 35; // Error, p3.age is read-only
p2.age = 45; // Ok, but also changes p3.age because of aliasing

class Car {
    readonly make: string;
    readonly model: string;
    readonly year = 2018;
  
    constructor() {
      this.make = "Unknown Make"; // Assignment permitted in constructor
      this.model = "Unknown Model"; // Assignment permitted in constructor
    }
  }

  // Template Literal Types
// Use to create complex string types
type OrderSize = "regular" | "large";
type OrderItem = "Espresso" | "Cappuccino";
type Order = `A ${OrderSize} ${OrderItem}`;

let order1: Order = "A regular Cappuccino";
let order2: Order = "A large Espresso";
let order3: Order = "A small Espresso"; // Error

// Iterators and Generators

// for..of statement
// iterate over the list of values on the object being iterated
let arrayOfAnyType = [1, "string", false];
for (const val of arrayOfAnyType) {
    console.log(val); // 1, "string", false
}

let list = [4, 5, 6];
for (const i of list) {
   console.log(i); // 4, 5, 6
}

// for..in statement
// iterate over the list of keys on the object being iterated
for (const i in list) {
   console.log(i); // "0", "1", "2"
}

// Type Assertion

let foo = {} // Creating foo as an empty object
foo.bar = 123 // Error: property 'bar' does not exist on `{}`
foo.baz = 'hello world' // Error: property 'baz' does not exist on `{}`

// Because the inferred type of foo is `{}` (an object with 0 properties), you
// are not allowed to add bar and baz to it. However with type assertion,
// the following will pass:

interface Foo {
  bar: number;
  baz: string;
}

let foo = {} as Foo; // Type assertion here
foo.bar = 123;
foo.baz = 'hello world'