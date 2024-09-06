import { capitalize, reverseString, calculator, caesarCipher, analyzeArray } from './functions';

// 1. Test Capitalize Function
test('capitalizes the first letter', () => {
  expect(capitalize('hello')).toBe('Hello');
  expect(capitalize('world')).toBe('World');
});

// 2. Test Reverse String Function
test('reverses a string', () => {
  expect(reverseString('hello')).toBe('olleh');
});

// 3. Test Calculator Object
test('adds numbers', () => {
  expect(calculator.add(1, 2)).toBe(3);
});

test('subtracts numbers', () => {
  expect(calculator.subtract(5, 3)).toBe(2);
});

test('multiplies numbers', () => {
  expect(calculator.multiply(2, 3)).toBe(6);
});

test('divides numbers', () => {
  expect(calculator.divide(6, 3)).toBe(2);
});

// 4. Test Caesar Cipher Function
test('shifts letters correctly', () => {
  expect(caesarCipher('abc', 3)).toBe('def');
});

test('wraps from z to a', () => {
  expect(caesarCipher('xyz', 3)).toBe('abc');
});

test('preserves case', () => {
  expect(caesarCipher('HeLLo', 3)).toBe('KhOOr');
});

test('keeps punctuation unchanged', () => {
  expect(caesarCipher('Hello, World!', 3)).toBe('Khoor, Zruog!');
});

// 5. Test Analyze Array Function
test('analyzes an array', () => {
  expect(analyzeArray([1, 8, 3, 4, 2, 6])).toEqual({
    average: 4,
    min: 1,
    max: 8,
    length: 6,
  });
});
