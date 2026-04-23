import Logo from './assets/react.svg?react';
// import dirty from './assets/react.svg';
// import dirty2 from './assets/vite.svg';
// import iconRaw from './assets/vite.svg?raw';

export function App2() {
  return (
    <div>
      <Logo width={200} className="text-blue-500" />
      {/* <img src={Logo} alt="logo" /> */}
      {/* <img src={dirty} alt="icon" />
      <img src={dirty2} alt="icon 2" /> */}
    </div>
  );
}