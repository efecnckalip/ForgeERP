function Card({
  title,
  value,
  icon,
  color = "text-blue-400",
  bg = "bg-blue-500/10",
  subtitle,
  children,
}) {
  const Icon = icon;

  return (
    <div className="bg-[#111c33] border border-slate-800 rounded-2xl p-5 shadow-lg hover:border-slate-700 transition">
      {Icon && (
        <div
          className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center mb-4`}
        >
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      )}

      {title && (
        <p className="text-sm text-slate-400">
          {title}
        </p>
      )}

      {value !== undefined && (
        <h2 className="text-2xl font-bold mt-1">
          {value}
        </h2>
      )}

      {subtitle && (
        <p className="text-xs text-slate-500 mt-2">
          {subtitle}
        </p>
      )}

      {children}
    </div>
  );
}

export default Card;