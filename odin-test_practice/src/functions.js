// 1. Capitalize Function
export const capitalize = (string) => {
    if (!string) return '';
    return string[0].toUpperCase() + string.slice(1);
  };
  
  // 2. Reverse String Function
  export const reverseString = (string) => {
    return string.split('').reverse().join('');
  };
  
  // 3. Calculator Object
  export const calculator = {
    add: (a, b) => a + b,
    subtract: (a, b) => a - b,
    divide: (a, b) => a / b,
    multiply: (a, b) => a * b,
  };
  
  // 4. Caesar Cipher Function
  export const caesarCipher = (string, shift) => {
    return string.split('').map((char) => {
      let code = char.charCodeAt(0);
      if (char >= 'A' && char <= 'Z') {
        return String.fromCharCode(((code - 65 + shift) % 26) + 65);
      } else if (char >= 'a' && char <= 'z') {
        return String.fromCharCode(((code - 97 + shift) % 26) + 97);
      } else {
        return char; 
      }
    }).join('');
  };
  
  // 5. Analyze Array Function
  export const analyzeArray = (array) => {
    const average = array.reduce((a, b) => a + b, 0) / array.length;
    const min = Math.min(...array);
    const max = Math.max(...array);
    return {
      average,
      min,
      max,
      length: array.length,
    };
  };
  