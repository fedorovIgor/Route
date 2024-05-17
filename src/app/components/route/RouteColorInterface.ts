export interface RouteColorInterface {
    
    // конвертирует пришедшие цвета с сервера в стандартный цвет (rgbA), а затем в hex
    convertColorToNormal(): void;

    // конвертирует цвета из стандартного hex в хранимый на сервервере формат
    colorHexToAbgr(hex: string, alpha: number): string
}