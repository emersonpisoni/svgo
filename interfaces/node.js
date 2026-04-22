import { optimize } from 'svgo';

const svg = `
<svg xmlns="http://www.w3.org/2000/svg"
  xmlns:xlink="http://www.w3.org/1999/xlink"
  viewBox="0 0 100 100">
  <text x="50" y="50" text-anchor="middle">•ᴗ•</text>
</svg>
`;

const { data } = optimize(svg);
console.log(data);
// <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text x="50" y="50" text-anchor="middle">•ᴗ•</text></svg>