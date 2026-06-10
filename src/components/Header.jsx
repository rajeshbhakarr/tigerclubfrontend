import "../styles/header.css";

function Header() {
  return (
    <div>
      <div className="in">Tigerclub</div>

      <div className="img">
        <img src="/bannerr.png" alt="not found" width={800} height={300} />
      </div>
    </div>,

    <p>Wallet Balance </p>,

    <button  className="" >   Withdrawl</button>,

    <a href="withdrawl">  withdrawl </a>

    

  );
}

export default Header;