const FloatingOrbs = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
    <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-[hsla(222,70%,40%,0.12)] blur-[100px] animate-float" />
    <div className="absolute top-2/3 right-1/4 w-96 h-96 rounded-full bg-[hsla(42,88%,42%,0.08)] blur-[120px] animate-float-delayed" />
    <div className="absolute bottom-1/4 left-1/2 w-64 h-64 rounded-full bg-[hsla(0,70%,32%,0.08)] blur-[100px] animate-float-slow" />
  </div>
);

export default FloatingOrbs;
