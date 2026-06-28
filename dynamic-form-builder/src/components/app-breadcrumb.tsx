import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { useLocation, Link } from "@tanstack/react-router"

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Optional: prettier labels for known segments.
const LABELS: Record<string, string> = {
  forms: "Forms",
  create: "New form",
  responses: "Responses",
  versions: "Versions",
  me: "Profile",
}

function labelFor(segment: string): string {
  if (LABELS[segment]) return LABELS[segment]
  if (UUID_RE.test(segment)) return segment.slice(0, 8) // shorten the id
  return segment.charAt(0).toUpperCase() + segment.slice(1)
}

export default function AppBreadcrumb() {
  const { pathname } = useLocation()
  const segments = pathname.split("/").filter(Boolean)

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {segments.map((segment, index) => {
          const url = "/" + segments.slice(0, index + 1).join("/")
          const label = labelFor(segment)
          const isLast = index === segments.length - 1

          return (
            <span key={url} className="flex items-center gap-1.5">
              {index > 0 && <BreadcrumbSeparator className="hidden md:block" />}
              <BreadcrumbItem
                className={index < segments.length - 1 ? "hidden md:block" : ""}
              >
                {isLast ? (
                  <BreadcrumbPage>{label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={url}>{label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </span>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}