-- CreateTable
CREATE TABLE "SymbolMapping" (
    "id" TEXT NOT NULL,
    "symbolId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sourceSymbol" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SymbolMapping_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SymbolMapping_symbolId_source_key" ON "SymbolMapping"("symbolId", "source");

-- AddForeignKey
ALTER TABLE "SymbolMapping" ADD CONSTRAINT "SymbolMapping_symbolId_fkey" FOREIGN KEY ("symbolId") REFERENCES "Symbol"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
