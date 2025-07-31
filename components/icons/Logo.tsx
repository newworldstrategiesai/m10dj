const Logo = ({ width = "64", height = "64", ...props }) => (
  <img
    src="/logo-static.jpg"
    alt="M10 DJ Company Logo"
    width={width}
    height={height}
    className="rounded-lg object-contain"
    {...props}
  />
);

export default Logo;
