export const money = n => n.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
export function PageHeader({title,subtitle,action}){return <div className="page-header"><div><h1>{title}</h1><p>{subtitle}</p></div>{action}</div>}
export function Card({children,className=""}){return <section className={`card ${className}`}>{children}</section>}
export function Status({children,type="ok"}){return <span className={`status ${type}`}>{children}</span>}
export function Field({label,required,children}){return <label className="field"><span>{label}{required&&<b> *</b>}</span>{children}</label>}
export function Button({children,secondary=false,danger=false,...p}){return <button className={`btn ${secondary?"secondary":""} ${danger?"danger":""}`} {...p}>{children}</button>}
