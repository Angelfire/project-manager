import runstackIcon from "@/assets/runstack.png";

export function AppHeader() {
  return (
    <header className="mb-8">
      <div className="flex items-center gap-4">
        <img
          src={runstackIcon}
          alt="RunStack"
          className="size-16"
          aria-hidden="true"
        />

        <div>
          <h1 className="text-3xl font-semibold text-foreground tracking-tight">
            RunStack
          </h1>
          <p className="text-muted-foreground text-sm mt-1.5 leading-relaxed">
            Manage and run your Node.js, Deno and Bun projects
          </p>
        </div>
      </div>
    </header>
  );
}
