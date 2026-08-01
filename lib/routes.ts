const aliases: Array<[string, string]> = [
  ["/authentication-center", "/qendra-e-autentikimit"],
  ["/authentication", "/autentikimi"],
  ["/buyer-protection", "/mbrojtja-e-bleresit"],
  ["/professional-sellers", "/shites-profesional"],
  ["/prohibited-items", "/produkte-te-ndaluara"],
  ["/shipping-policy", "/dergesa"],
  ["/notifications", "/njoftimet"],
  ["/dashboard", "/paneli-i-shitesit"],
  ["/settings", "/cilesimet"],
  ["/messages", "/mesazhet"],
  ["/explore", "/eksploro"],
  ["/search", "/kerko"],
  ["/brands", "/brendet"],
  ["/stories", "/histori"],
  ["/profile", "/profili"],
  ["/orders", "/porosite"],
  ["/returns", "/kthimet"],
  ["/privacy", "/privatesia"],
  ["/terms", "/kushtet"],
  ["/contact", "/kontakt"],
  ["/saved", "/te-ruajturat"],
  ["/cart", "/shporta"],
  ["/checkout", "/pagesa"],
  ["/admin", "/administrimi"],
  ["/sell", "/shit"],
  ["/faq", "/pyetje-te-shpeshta"],
  ["/listing", "/shpallja"],
  ["/seller", "/shitesi"],
  ["/verify", "/verifiko"],
];

export const albanianRoutes = Object.fromEntries(aliases) as Record<string, string>;

export function canonicalPath(pathname: string) {
  for (const [english, albanian] of aliases) {
    if (pathname === albanian || pathname.startsWith(`${albanian}/`))
      return `${english}${pathname.slice(albanian.length)}`;
  }
  return pathname;
}
