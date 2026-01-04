import runstackIcon from "@/assets/runstack.png";

export function AppHeader() {
  return (
    <header className="mb-10">
      <div className="flex items-center gap-4">
        <img src={runstackIcon} alt="RunStack" className="size-16" />

        <div>
          <h1 className="text-3xl font-semibold text-foreground">RunStack</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage and run your Node.js, Deno and Bun projects
          </p>
        </div>
      </div>
    </header>
  );
}
