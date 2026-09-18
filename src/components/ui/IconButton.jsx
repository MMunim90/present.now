export default function IconButton({ label, children, onClick }) { return <button className="icon-button" type="button" aria-label={label} title={label} onClick={onClick}>{children}</button> }
