export const placeholder = {
    answer: (language: string) => {
        switch (language) {
            case "en":
                return "Write your answer here...";
            case "es":
                return "Escribe tu respuesta aquí...";
            case 'da':
                return 'Skriv dit svar her...';
            case 'fi':
                return 'Kirjoita vastauksesi tähän...';
            case 'sv':
                return 'Skriv ditt svar här...';
            case 'no':
                return 'Skriv svaret ditt her...';
            case 'ar':
                return 'اكتب إجابتك هنا...';
            case 'bn':
                return 'এখানে আপনার';
            default:
                return "Write your answer here...";
        }
    },
    number: (language: string) => {
        switch (language) {
            case "en":
                return "Write your number here...";
            case "es":
                return "Escribe tu número aquí...";
            case 'da':
                return 'Skriv dit nummer her...';
            case 'fi':
                return 'Kirjoita numerosi tähän...';
            case 'sv':
                return 'Skriv ditt nummer här...';
            case 'no':
                return 'Skriv nummeret ditt her...';
            case 'ar':
                return 'اكتب رقمك هنا...';
            case 'bn':
                return 'এখানে আপনার';
            default:
                return "Write your number here...";
        }
    },
    email: (language: string) => {
        switch (language) {
            case "en":
                return "Write your email here...";
            case "es":
                return "Escribe tu correo electrónico aquí...";
            case 'da':
                return 'Skriv din e-mail her...';
            case 'fi':
                return 'Kirjoita sähköpostiosoitteesi tähän...';
            case 'sv':
                return 'Skriv din e-post här...';
            case 'no':
                return 'Skriv e-posten din her...';
            case 'ar':
                return 'اكتب بريدك الإلكتروني هنا...';
            case 'bn':
                return 'এখানে আপনার';
            default:
                return "Write your email here...";
        }
    },
    date: (language: string) => {
        switch (language) {
            case "en":
                return "Write your date here...";
            case "es":
                return "Escribe tu fecha aquí...";
            case 'da':
                return 'Skriv din dato her...';
            case 'fi':
                return 'Kirjoita päivämääräsi tähän...';
            case 'sv':
                return 'Skriv ditt datum här...';
            case 'no':
                return 'Skriv datoen din her...';
            case 'ar':
                return 'اكتب تاريخك هنا...';
            case 'bn':
                return 'এখানে আপনার';
            default:
                return "Write your date here...";
        }
    },
    password: (language: string) => {
        switch (language) {
            case "en":
                return "Write your password here...";
            case "es":
                return "Escribe tu contraseña aquí...";
            case 'da':
                return 'Skriv dit kodeord her...';
            case 'fi':
                return 'Kirjoita salasanasi tähän...';
            case 'sv':
                return 'Skriv ditt lösenord här...';
            case 'no':
                return 'Skriv passordet ditt her...';
            case 'ar':
                return 'اكتب كلمة المرور الخاصة بك هنا...';
            case 'bn':
                return 'এখানে আপনার';
            default:
                return "Write your password here...";
        }
    },
    pointsystemerror: (language: string) => {
        switch (language) {
            case "en":
                return "The total points must be 100 %"
            case "es":
                return "El total de puntos debe ser 100 %"
            case 'da':
                return 'Samlet antal point skal være 100 %'
            case 'fi':
                return 'Kokonaispisteiden on oltava 100 %'
            case 'sv':
                return 'Totala poäng måste vara 100 %'
            case 'no':
                return 'Totalt antall poeng må være 100 %'
            case 'ar':
                return 'يجب أن تكون النقاط الإجمالية 100 %'
            case 'bn':
                return 'মোট পয়েন্ট 100 % হতে হবে'
            default:
                return "The total points must be 100 %"
        }
    },
    upload: {
        cta: (language: string) => {
            switch (language) {
                case "es":
                    return "Arrastra y suelta o haz clic para subir";
                case "da":
                    return "Træk og slip eller klik for at uploade";
                case "fi":
                    return "Vedä ja pudota tai napsauta ladataksesi";
                case "sv":
                    return "Dra och släpp eller klicka för att ladda upp";
                case "no":
                    return "Dra og slipp eller klikk for å laste opp";
                case "ar":
                    return "اسحب وأفلت أو انقر للتحميل";
                case "bn":
                    return "টেনে আনুন বা আপলোড করতে ক্লিক করুন";
                case "en":
                default:
                    return "Drag & drop or click to upload";
            }
        },
        formats: (language: string, kind: "image" | "file") => {
            if (kind === "image") {
                switch (language) {
                    case "es":
                        return "Solo imágenes";
                    case "da":
                        return "Kun billeder";
                    case "fi":
                        return "Vain kuvat";
                    case "sv":
                        return "Endast bilder";
                    case "no":
                        return "Kun bilder";
                    case "ar":
                        return "الصور فقط";
                    case "bn":
                        return "শুধুমাত্র ছবি";
                    case "en":
                    default:
                        return "Images only";
                }
            }
            switch (language) {
                case "es":
                    return "Cualquier tipo de archivo";
                case "da":
                    return "Enhver filtype";
                case "fi":
                    return "Mikä tahansa tiedostotyyppi";
                case "sv":
                    return "Alla filtyper";
                case "no":
                    return "Alle filtyper";
                case "ar":
                    return "أي نوع من الملفات";
                case "bn":
                    return "যেকোনো ধরনের ফাইল";
                case "en":
                default:
                    return "Any file type";
            }
        },
        maxFiles: (language: string, n: number) => {
            switch (language) {
                case "es":
                    return `Máx. ${n} archivos`;
                case "da":
                    return `Maks. ${n} filer`;
                case "fi":
                    return `Enintään ${n} tiedostoa`;
                case "sv":
                    return `Max ${n} filer`;
                case "no":
                    return `Maks ${n} filer`;
                case "ar":
                    return `${n} ملفات كحد أقصى`;
                case "bn":
                    return `সর্বোচ্চ ${n}টি ফাইল`;
                case "en":
                default:
                    return `Max ${n} files`;
            }
        },
        maxSize: (language: string, mb: number) => {
            switch (language) {
                case "es":
                    return `Máx. ${mb} MB`;
                case "da":
                    return `Maks. ${mb} MB`;
                case "fi":
                    return `Enintään ${mb} MB`;
                case "sv":
                    return `Max ${mb} MB`;
                case "no":
                    return `Maks ${mb} MB`;
                case "ar":
                    return `${mb} ميغابايت كحد أقصى`;
                case "bn":
                    return `সর্বোচ্চ ${mb} MB`;
                case "en":
                default:
                    return `Max ${mb} MB`;
            }
        },
        tooLarge: (language: string, mb: number) => {
            switch (language) {
                case "es":
                    return `Archivo demasiado grande (máx. ${mb} MB)`;
                case "da":
                    return `Filen er for stor (maks. ${mb} MB)`;
                case "fi":
                    return `Tiedosto on liian suuri (enintään ${mb} MB)`;
                case "sv":
                    return `Filen är för stor (max ${mb} MB)`;
                case "no":
                    return `Filen er for stor (maks ${mb} MB)`;
                case "ar":
                    return `الملف كبير جدًا (الحد الأقصى ${mb} ميغابايت)`;
                case "bn":
                    return `ফাইলটি খুব বড় (সর্বোচ্চ ${mb} MB)`;
                case "en":
                default:
                    return `File is too large (max ${mb} MB)`;
            }
        },
        remove: (language: string) => {
            switch (language) {
                case "es":
                    return "Eliminar";
                case "da":
                    return "Fjern";
                case "fi":
                    return "Poista";
                case "sv":
                    return "Ta bort";
                case "no":
                    return "Fjern";
                case "ar":
                    return "إزالة";
                case "bn":
                    return "সরান";
                case "en":
                default:
                    return "Remove";
            }
        }
    }
};
