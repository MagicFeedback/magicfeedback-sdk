/**
 * Central translation table for every string the SDK renders on its own.
 *
 * Before this module the copy lived in three disconnected places
 * (`services/placeholder.ts`, `render/helpers.ts#getBooleanOptions` and a dict
 * inlined in `render/renderPriorityList.ts`), each with a different language
 * list, so a survey in German got a translated priority list but an English
 * input placeholder. Everything now resolves through `t()`.
 *
 * Fully translated languages (the set the product supports):
 *   en, da, fi, no, es, sv, ar, bn, de, pt, fr
 *
 * `it, nl, pl, ru, ja, zh, ko` are kept as partial locales: they only ever had
 * yes/no and priority-list copy, and they keep exactly that. Any key they are
 * missing falls back to English, which is what they rendered before.
 */

const EN = {
    // Input placeholders
    "placeholder.answer": "Write your answer here...",
    "placeholder.number": "Write your number here...",
    "placeholder.email": "Write your email here...",
    "placeholder.date": "Write your date here...",
    "placeholder.password": "Write your password here...",

    // POINT_SYSTEM
    "pointSystem.error": "The total points must be 100 %",

    // BOOLEAN
    "boolean.yes": "Yes",
    "boolean.no": "No",

    // Uploads ({n}, {mb} are interpolated)
    "upload.cta": "Drag & drop or click to upload",
    "upload.imagesOnly": "Images only",
    "upload.anyFileType": "Any file type",
    "upload.maxFiles": "Max {n} files",
    "upload.maxSize": "Max {mb} MB",
    "upload.tooLarge": "File is too large (max {mb} MB)",
    "upload.remove": "Remove",

    // SELECT
    "select.placeholder": "Select an option",

    // Ratings
    "rating.ariaLabel": "Rating",

    // PRIORITY_LIST
    "priority.selectUpTo": "Select up to",
    "priority.options": "options",
    "priority.thenOrder": "and then order them",
    "priority.selectOptions": "Select options",
    "priority.cancel": "Cancel",
    "priority.confirm": "Confirm",
    "priority.selectOptionNumber": "Select option #",
    "priority.prioritized": "Prioritized",
    "priority.of": "of",
    "priority.instruction": "Your priority list can be seen below. If you wish, you can rearrange your choices using the arrows. Click 'Next' to confirm your selection and proceed.",

    // Actions
    "action.send": "Send",
    "action.back": "Back",
    "action.next": "Next",
    "action.start": "Go!",

    // Flow messages ({seconds} is interpolated)
    "message.success": "Thank you for your feedback!",
    "message.blocked": "Thanks for your time - we'll end the conversation here.",
    "message.required": "Please answer before continuing.",
    "message.rateLimit": "Too many requests. Retrying in {seconds}s..."
};

export type TranslationKey = keyof typeof EN;

type Locale = Partial<Record<TranslationKey, string>>;

const ES: Locale = {
    "placeholder.answer": "Escribe tu respuesta aquí...",
    "placeholder.number": "Escribe tu número aquí...",
    "placeholder.email": "Escribe tu correo electrónico aquí...",
    "placeholder.date": "Escribe tu fecha aquí...",
    "placeholder.password": "Escribe tu contraseña aquí...",
    "pointSystem.error": "El total de puntos debe ser 100 %",
    "boolean.yes": "Sí",
    "boolean.no": "No",
    "upload.cta": "Arrastra y suelta o haz clic para subir",
    "upload.imagesOnly": "Solo imágenes",
    "upload.anyFileType": "Cualquier tipo de archivo",
    "upload.maxFiles": "Máx. {n} archivos",
    "upload.maxSize": "Máx. {mb} MB",
    "upload.tooLarge": "Archivo demasiado grande (máx. {mb} MB)",
    "upload.remove": "Eliminar",
    "select.placeholder": "Selecciona una opción",
    "rating.ariaLabel": "Valoración",
    "priority.selectUpTo": "Selecciona hasta",
    "priority.options": "opciones",
    "priority.thenOrder": "y luego ordénalas",
    "priority.selectOptions": "Seleccionar opciones",
    "priority.cancel": "Cancelar",
    "priority.confirm": "Confirmar",
    "priority.selectOptionNumber": "Selecciona la opción #",
    "priority.prioritized": "Priorizadas",
    "priority.of": "de",
    "priority.instruction": "Tu lista priorizada se muestra abajo. Si deseas, puedes reordenar las opciones con las flechas. Haz clic en \"Siguiente\" para confirmar y continuar.",
    "action.send": "Enviar",
    "action.back": "Atrás",
    "action.next": "Siguiente",
    "action.start": "¡Empezar!",
    "message.success": "¡Gracias por tus comentarios!",
    "message.blocked": "Gracias por tu tiempo, terminamos aquí la conversación.",
    "message.required": "Por favor, responde antes de continuar.",
    "message.rateLimit": "Demasiadas solicitudes. Reintentando en {seconds} s..."
};

const DE: Locale = {
    "placeholder.answer": "Schreiben Sie hier Ihre Antwort...",
    "placeholder.number": "Geben Sie hier Ihre Zahl ein...",
    "placeholder.email": "Geben Sie hier Ihre E-Mail-Adresse ein...",
    "placeholder.date": "Geben Sie hier Ihr Datum ein...",
    "placeholder.password": "Geben Sie hier Ihr Passwort ein...",
    "pointSystem.error": "Die Gesamtpunktzahl muss 100 % betragen",
    "boolean.yes": "Ja",
    "boolean.no": "Nein",
    "upload.cta": "Ziehen Sie Dateien hierher oder klicken Sie zum Hochladen",
    "upload.imagesOnly": "Nur Bilder",
    "upload.anyFileType": "Beliebiger Dateityp",
    "upload.maxFiles": "Max. {n} Dateien",
    "upload.maxSize": "Max. {mb} MB",
    "upload.tooLarge": "Datei ist zu groß (max. {mb} MB)",
    "upload.remove": "Entfernen",
    "select.placeholder": "Option auswählen",
    "rating.ariaLabel": "Bewertung",
    "priority.selectUpTo": "Wählen Sie bis zu",
    "priority.options": "Optionen",
    "priority.thenOrder": "und ordnen Sie sie dann",
    "priority.selectOptions": "Optionen auswählen",
    "priority.cancel": "Abbrechen",
    "priority.confirm": "Bestätigen",
    "priority.selectOptionNumber": "Wählen Sie Option #",
    "priority.prioritized": "Priorisiert",
    "priority.of": "von",
    "priority.instruction": "Ihre Prioritätenliste wird unten angezeigt. Wenn Sie möchten, können Sie Ihre Auswahl mit den Pfeilen neu anordnen. Klicken Sie auf \"Weiter\", um Ihre Auswahl zu bestätigen und fortzufahren.",
    "action.send": "Senden",
    "action.back": "Zurück",
    "action.next": "Weiter",
    "action.start": "Los!",
    "message.success": "Vielen Dank für Ihr Feedback!",
    "message.blocked": "Danke für Ihre Zeit - wir beenden das Gespräch hier.",
    "message.required": "Bitte antworten Sie, bevor Sie fortfahren.",
    "message.rateLimit": "Zu viele Anfragen. Erneuter Versuch in {seconds} s..."
};

const FR: Locale = {
    "placeholder.answer": "Écrivez votre réponse ici...",
    "placeholder.number": "Écrivez votre nombre ici...",
    "placeholder.email": "Écrivez votre e-mail ici...",
    "placeholder.date": "Écrivez votre date ici...",
    "placeholder.password": "Écrivez votre mot de passe ici...",
    "pointSystem.error": "Le total des points doit être de 100 %",
    "boolean.yes": "Oui",
    "boolean.no": "Non",
    "upload.cta": "Glissez-déposez ou cliquez pour téléverser",
    "upload.imagesOnly": "Images uniquement",
    "upload.anyFileType": "Tout type de fichier",
    "upload.maxFiles": "Max. {n} fichiers",
    "upload.maxSize": "Max. {mb} Mo",
    "upload.tooLarge": "Fichier trop volumineux (max. {mb} Mo)",
    "upload.remove": "Supprimer",
    "select.placeholder": "Sélectionnez une option",
    "rating.ariaLabel": "Évaluation",
    "priority.selectUpTo": "Sélectionnez jusqu'à",
    "priority.options": "options",
    "priority.thenOrder": "puis classez-les",
    "priority.selectOptions": "Sélectionner des options",
    "priority.cancel": "Annuler",
    "priority.confirm": "Confirmer",
    "priority.selectOptionNumber": "Sélectionnez l'option #",
    "priority.prioritized": "Priorisées",
    "priority.of": "sur",
    "priority.instruction": "Votre liste de priorités est affichée ci-dessous. Si vous le souhaitez, vous pouvez réorganiser vos choix à l'aide des flèches. Cliquez sur \"Suivant\" pour confirmer votre sélection et continuer.",
    "action.send": "Envoyer",
    "action.back": "Retour",
    "action.next": "Suivant",
    "action.start": "C'est parti !",
    "message.success": "Merci pour votre retour !",
    "message.blocked": "Merci pour votre temps, nous terminons la conversation ici.",
    "message.required": "Veuillez répondre avant de continuer.",
    "message.rateLimit": "Trop de requêtes. Nouvelle tentative dans {seconds} s..."
};

const PT: Locale = {
    "placeholder.answer": "Escreva sua resposta aqui...",
    "placeholder.number": "Escreva seu número aqui...",
    "placeholder.email": "Escreva seu e-mail aqui...",
    "placeholder.date": "Escreva sua data aqui...",
    "placeholder.password": "Escreva sua senha aqui...",
    "pointSystem.error": "O total de pontos deve ser 100 %",
    "boolean.yes": "Sim",
    "boolean.no": "Não",
    "upload.cta": "Arraste e solte ou clique para enviar",
    "upload.imagesOnly": "Somente imagens",
    "upload.anyFileType": "Qualquer tipo de arquivo",
    "upload.maxFiles": "Máx. {n} arquivos",
    "upload.maxSize": "Máx. {mb} MB",
    "upload.tooLarge": "Arquivo muito grande (máx. {mb} MB)",
    "upload.remove": "Remover",
    "select.placeholder": "Selecione uma opção",
    "rating.ariaLabel": "Avaliação",
    "priority.selectUpTo": "Selecione até",
    "priority.options": "opções",
    "priority.thenOrder": "e depois ordene-as",
    "priority.selectOptions": "Selecionar opções",
    "priority.cancel": "Cancelar",
    "priority.confirm": "Confirmar",
    "priority.selectOptionNumber": "Selecione a opção #",
    "priority.prioritized": "Priorizadas",
    "priority.of": "de",
    "priority.instruction": "Sua lista de prioridades pode ser vista abaixo. Se quiser, você pode reorganizar suas escolhas usando as setas. Clique em \"Próximo\" para confirmar sua seleção e continuar.",
    "action.send": "Enviar",
    "action.back": "Voltar",
    "action.next": "Próximo",
    "action.start": "Começar!",
    "message.success": "Obrigado pelo seu feedback!",
    "message.blocked": "Obrigado pelo seu tempo, encerramos a conversa por aqui.",
    "message.required": "Responda antes de continuar.",
    "message.rateLimit": "Muitas solicitações. Tentando novamente em {seconds} s..."
};

const DA: Locale = {
    "placeholder.answer": "Skriv dit svar her...",
    "placeholder.number": "Skriv dit nummer her...",
    "placeholder.email": "Skriv din e-mail her...",
    "placeholder.date": "Skriv din dato her...",
    "placeholder.password": "Skriv dit kodeord her...",
    "pointSystem.error": "Samlet antal point skal være 100 %",
    "boolean.yes": "Ja",
    "boolean.no": "Nej",
    "upload.cta": "Træk og slip eller klik for at uploade",
    "upload.imagesOnly": "Kun billeder",
    "upload.anyFileType": "Enhver filtype",
    "upload.maxFiles": "Maks. {n} filer",
    "upload.maxSize": "Maks. {mb} MB",
    "upload.tooLarge": "Filen er for stor (maks. {mb} MB)",
    "upload.remove": "Fjern",
    "select.placeholder": "Vælg en mulighed",
    "rating.ariaLabel": "Bedømmelse",
    "priority.selectUpTo": "Vælg op til",
    "priority.options": "muligheder",
    "priority.thenOrder": "og sorter dem derefter",
    "priority.selectOptions": "Vælg muligheder",
    "priority.cancel": "Annuller",
    "priority.confirm": "Bekræft",
    "priority.selectOptionNumber": "Vælg mulighed #",
    "priority.prioritized": "Prioriteret",
    "priority.of": "af",
    "priority.instruction": "Din prioritetsliste vises nedenfor. Hvis du ønsker det, kan du omarrangere dine valg ved hjælp af pilene. Klik på \"Næste\" for at bekræfte dit valg og fortsætte.",
    "action.send": "Send",
    "action.back": "Tilbage",
    "action.next": "Næste",
    "action.start": "Start!",
    "message.success": "Tak for din feedback!",
    "message.blocked": "Tak for din tid - vi afslutter samtalen her.",
    "message.required": "Svar venligst, før du fortsætter.",
    "message.rateLimit": "For mange forespørgsler. Prøver igen om {seconds} s..."
};

const FI: Locale = {
    "placeholder.answer": "Kirjoita vastauksesi tähän...",
    "placeholder.number": "Kirjoita numerosi tähän...",
    "placeholder.email": "Kirjoita sähköpostiosoitteesi tähän...",
    "placeholder.date": "Kirjoita päivämääräsi tähän...",
    "placeholder.password": "Kirjoita salasanasi tähän...",
    "pointSystem.error": "Kokonaispisteiden on oltava 100 %",
    "boolean.yes": "Kyllä",
    "boolean.no": "Ei",
    "upload.cta": "Vedä ja pudota tai napsauta ladataksesi",
    "upload.imagesOnly": "Vain kuvat",
    "upload.anyFileType": "Mikä tahansa tiedostotyyppi",
    "upload.maxFiles": "Enintään {n} tiedostoa",
    "upload.maxSize": "Enintään {mb} MB",
    "upload.tooLarge": "Tiedosto on liian suuri (enintään {mb} MB)",
    "upload.remove": "Poista",
    "select.placeholder": "Valitse vaihtoehto",
    "rating.ariaLabel": "Arvio",
    "priority.selectUpTo": "Valitse enintään",
    "priority.options": "vaihtoehtoa",
    "priority.thenOrder": "ja järjestä ne sitten",
    "priority.selectOptions": "Valitse vaihtoehdot",
    "priority.cancel": "Peruuta",
    "priority.confirm": "Vahvista",
    "priority.selectOptionNumber": "Valitse vaihtoehto #",
    "priority.prioritized": "Priorisoitu",
    "priority.of": " / ",
    "priority.instruction": "Prioriteettilistasi näkyy alla. Voit halutessasi järjestää valinnat uudelleen nuolien avulla. Napsauta \"Seuraava\" vahvistaaksesi valinnan ja jatkaaksesi.",
    "action.send": "Lähetä",
    "action.back": "Takaisin",
    "action.next": "Seuraava",
    "action.start": "Aloita!",
    "message.success": "Kiitos palautteestasi!",
    "message.blocked": "Kiitos ajastasi - lopetamme keskustelun tähän.",
    "message.required": "Vastaa ennen jatkamista.",
    "message.rateLimit": "Liikaa pyyntöjä. Yritetään uudelleen {seconds} s kuluttua..."
};

const NO: Locale = {
    "placeholder.answer": "Skriv svaret ditt her...",
    "placeholder.number": "Skriv nummeret ditt her...",
    "placeholder.email": "Skriv e-posten din her...",
    "placeholder.date": "Skriv datoen din her...",
    "placeholder.password": "Skriv passordet ditt her...",
    "pointSystem.error": "Totalt antall poeng må være 100 %",
    "boolean.yes": "Ja",
    "boolean.no": "Nei",
    "upload.cta": "Dra og slipp eller klikk for å laste opp",
    "upload.imagesOnly": "Kun bilder",
    "upload.anyFileType": "Alle filtyper",
    "upload.maxFiles": "Maks {n} filer",
    "upload.maxSize": "Maks {mb} MB",
    "upload.tooLarge": "Filen er for stor (maks {mb} MB)",
    "upload.remove": "Fjern",
    "select.placeholder": "Velg et alternativ",
    "rating.ariaLabel": "Vurdering",
    "priority.selectUpTo": "Velg opptil",
    "priority.options": "alternativer",
    "priority.thenOrder": "og ordne dem deretter",
    "priority.selectOptions": "Velg alternativer",
    "priority.cancel": "Avbryt",
    "priority.confirm": "Bekreft",
    "priority.selectOptionNumber": "Velg alternativ #",
    "priority.prioritized": "Prioritert",
    "priority.of": "av",
    "priority.instruction": "Prioriteringslisten din vises nedenfor. Hvis du ønsker det, kan du ordne valgene dine ved hjelp av pilene. Klikk på \"Neste\" for å bekrefte valget ditt og fortsette.",
    "action.send": "Send",
    "action.back": "Tilbake",
    "action.next": "Neste",
    "action.start": "Start!",
    "message.success": "Takk for tilbakemeldingen!",
    "message.blocked": "Takk for tiden din - vi avslutter samtalen her.",
    "message.required": "Vennligst svar før du fortsetter.",
    "message.rateLimit": "For mange forespørsler. Prøver igjen om {seconds} s..."
};

const SV: Locale = {
    "placeholder.answer": "Skriv ditt svar här...",
    "placeholder.number": "Skriv ditt nummer här...",
    "placeholder.email": "Skriv din e-post här...",
    "placeholder.date": "Skriv ditt datum här...",
    "placeholder.password": "Skriv ditt lösenord här...",
    "pointSystem.error": "Totala poäng måste vara 100 %",
    "boolean.yes": "Ja",
    "boolean.no": "Nej",
    "upload.cta": "Dra och släpp eller klicka för att ladda upp",
    "upload.imagesOnly": "Endast bilder",
    "upload.anyFileType": "Alla filtyper",
    "upload.maxFiles": "Max {n} filer",
    "upload.maxSize": "Max {mb} MB",
    "upload.tooLarge": "Filen är för stor (max {mb} MB)",
    "upload.remove": "Ta bort",
    "select.placeholder": "Välj ett alternativ",
    "rating.ariaLabel": "Betyg",
    "priority.selectUpTo": "Välj upp till",
    "priority.options": "alternativ",
    "priority.thenOrder": "och ordna dem sedan",
    "priority.selectOptions": "Välj alternativ",
    "priority.cancel": "Avbryt",
    "priority.confirm": "Bekräfta",
    "priority.selectOptionNumber": "Välj alternativ #",
    "priority.prioritized": "Prioriterat",
    "priority.of": "av",
    "priority.instruction": "Din prioriteringslista visas nedan. Om du vill kan du ordna om dina val med hjälp av pilarna. Klicka på \"Nästa\" för att bekräfta ditt val och fortsätta.",
    "action.send": "Skicka",
    "action.back": "Tillbaka",
    "action.next": "Nästa",
    "action.start": "Kör!",
    "message.success": "Tack för din feedback!",
    "message.blocked": "Tack för din tid - vi avslutar samtalet här.",
    "message.required": "Svara innan du fortsätter.",
    "message.rateLimit": "För många förfrågningar. Försöker igen om {seconds} s..."
};

const AR: Locale = {
    "placeholder.answer": "اكتب إجابتك هنا...",
    "placeholder.number": "اكتب رقمك هنا...",
    "placeholder.email": "اكتب بريدك الإلكتروني هنا...",
    "placeholder.date": "اكتب تاريخك هنا...",
    "placeholder.password": "اكتب كلمة المرور الخاصة بك هنا...",
    "pointSystem.error": "يجب أن تكون النقاط الإجمالية 100 %",
    "boolean.yes": "نعم",
    "boolean.no": "لا",
    "upload.cta": "اسحب وأفلت أو انقر للتحميل",
    "upload.imagesOnly": "الصور فقط",
    "upload.anyFileType": "أي نوع من الملفات",
    "upload.maxFiles": "{n} ملفات كحد أقصى",
    "upload.maxSize": "{mb} ميغابايت كحد أقصى",
    "upload.tooLarge": "الملف كبير جدًا (الحد الأقصى {mb} ميغابايت)",
    "upload.remove": "إزالة",
    "select.placeholder": "اختر خيارًا",
    "rating.ariaLabel": "التقييم",
    "priority.selectUpTo": "اختر حتى",
    "priority.options": "خيارات",
    "priority.thenOrder": "ثم رتبها",
    "priority.selectOptions": "اختر الخيارات",
    "priority.cancel": "إلغاء",
    "priority.confirm": "تأكيد",
    "priority.selectOptionNumber": "اختر الخيار #",
    "priority.prioritized": "تم الترتيب",
    "priority.of": "من",
    "priority.instruction": "تظهر قائمة الأولويات الخاصة بك أدناه. إذا رغبت، يمكنك إعادة ترتيب اختياراتك باستخدام الأسهم. انقر على \"التالي\" لتأكيد اختيارك والمتابعة.",
    "action.send": "إرسال",
    "action.back": "رجوع",
    "action.next": "التالي",
    "action.start": "ابدأ!",
    "message.success": "شكرًا لملاحظاتك!",
    "message.blocked": "شكرًا على وقتك، سننهي المحادثة هنا.",
    "message.required": "يرجى الإجابة قبل المتابعة.",
    "message.rateLimit": "طلبات كثيرة جدًا. سنعيد المحاولة خلال {seconds} ثانية..."
};

const BN: Locale = {
    "placeholder.answer": "এখানে আপনার উত্তর লিখুন...",
    "placeholder.number": "এখানে আপনার সংখ্যা লিখুন...",
    "placeholder.email": "এখানে আপনার ইমেইল লিখুন...",
    "placeholder.date": "এখানে আপনার তারিখ লিখুন...",
    "placeholder.password": "এখানে আপনার পাসওয়ার্ড লিখুন...",
    "pointSystem.error": "মোট পয়েন্ট 100 % হতে হবে",
    "boolean.yes": "হ্যাঁ",
    "boolean.no": "না",
    "upload.cta": "টেনে আনুন বা আপলোড করতে ক্লিক করুন",
    "upload.imagesOnly": "শুধুমাত্র ছবি",
    "upload.anyFileType": "যেকোনো ধরনের ফাইল",
    "upload.maxFiles": "সর্বোচ্চ {n}টি ফাইল",
    "upload.maxSize": "সর্বোচ্চ {mb} MB",
    "upload.tooLarge": "ফাইলটি খুব বড় (সর্বোচ্চ {mb} MB)",
    "upload.remove": "সরান",
    "select.placeholder": "একটি বিকল্প নির্বাচন করুন",
    "rating.ariaLabel": "রেটিং",
    "priority.selectUpTo": "সর্বোচ্চ নির্বাচন করুন",
    "priority.options": "টি বিকল্প",
    "priority.thenOrder": "তারপর সেগুলো সাজান",
    "priority.selectOptions": "বিকল্প নির্বাচন করুন",
    "priority.cancel": "বাতিল",
    "priority.confirm": "নিশ্চিত করুন",
    "priority.selectOptionNumber": "বিকল্প # নির্বাচন করুন",
    "priority.prioritized": "অগ্রাধিকারপ্রাপ্ত",
    "priority.of": "এর মধ্যে",
    "priority.instruction": "আপনার অগ্রাধিকার তালিকা নিচে দেখানো হয়েছে। চাইলে তীর চিহ্ন ব্যবহার করে আপনার পছন্দগুলো পুনরায় সাজাতে পারেন। \"পরবর্তী\" ক্লিক করে আপনার নির্বাচন নিশ্চিত করুন এবং এগিয়ে যান।",
    "action.send": "পাঠান",
    "action.back": "পিছনে",
    "action.next": "পরবর্তী",
    "action.start": "শুরু করুন!",
    "message.success": "আপনার মতামতের জন্য ধন্যবাদ!",
    "message.blocked": "আপনার সময়ের জন্য ধন্যবাদ, আমরা এখানেই কথোপকথন শেষ করছি।",
    "message.required": "চালিয়ে যাওয়ার আগে অনুগ্রহ করে উত্তর দিন।",
    "message.rateLimit": "অনেক বেশি অনুরোধ। {seconds} সেকেন্ডে আবার চেষ্টা করা হচ্ছে..."
};

// Partial locales: only the keys these languages already had. Everything else
// falls back to English, exactly as it did before this module existed.
const IT: Locale = {
    "boolean.yes": "Sì",
    "boolean.no": "No",
    "priority.selectUpTo": "Seleziona fino a",
    "priority.options": "opzioni",
    "priority.thenOrder": "e poi ordinali",
    "priority.selectOptions": "Seleziona opzioni",
    "priority.cancel": "Annulla",
    "priority.confirm": "Conferma",
    "priority.selectOptionNumber": "Seleziona opzione #",
    "priority.prioritized": "Prioritizzate",
    "priority.of": "di",
    "priority.instruction": "La tua lista di priorità è mostrata qui sotto. Se vuoi, puoi riordinare le tue scelte usando le frecce. Clicca su \"Avanti\" per confermare la selezione e continuare."
};

const NL: Locale = {
    "boolean.yes": "Ja",
    "boolean.no": "Nee",
    "priority.selectUpTo": "Selecteer tot",
    "priority.options": "opties",
    "priority.thenOrder": "en rangschik ze vervolgens",
    "priority.selectOptions": "Selecteer opties",
    "priority.cancel": "Annuleren",
    "priority.confirm": "Bevestigen",
    "priority.selectOptionNumber": "Selecteer optie #",
    "priority.prioritized": "Geprioriteerd",
    "priority.of": "van",
    "priority.instruction": "Je prioriteitenlijst wordt hieronder weergegeven. Als je wilt, kun je je keuzes herschikken met behulp van de pijlen. Klik op \"Volgende\" om je selectie te bevestigen en door te gaan."
};

const PL: Locale = {
    "boolean.yes": "Tak",
    "boolean.no": "Nie",
    "priority.selectUpTo": "Wybierz do",
    "priority.options": "opcje",
    "priority.thenOrder": "a następnie je uporządkuj",
    "priority.selectOptions": "Wybierz opcje",
    "priority.cancel": "Anuluj",
    "priority.confirm": "Potwierdź",
    "priority.selectOptionNumber": "Wybierz opcję #",
    "priority.prioritized": "Priorytetowe",
    "priority.of": "z",
    "priority.instruction": "Twoja lista priorytetów jest pokazana poniżej. Jeśli chcesz, możesz zmienić kolejność swoich wyborów za pomocą strzałek. Kliknij \"Dalej\", aby potwierdzić wybór i kontynuować."
};

const RU: Locale = {
    "boolean.yes": "Да",
    "boolean.no": "Нет",
    "priority.selectUpTo": "Выберите до",
    "priority.options": "вариантов",
    "priority.thenOrder": "а затем упорядочьте их",
    "priority.selectOptions": "Выбрать варианты",
    "priority.cancel": "Отмена",
    "priority.confirm": "Подтвердить",
    "priority.selectOptionNumber": "Выберите вариант #",
    "priority.prioritized": "Приоритеты",
    "priority.of": "из",
    "priority.instruction": "Ваш список приоритетов отображается ниже. Если хотите, вы можете изменить порядок вариантов с помощью стрелок. Нажмите \"Далее\", чтобы подтвердить выбор и продолжить."
};

const JA: Locale = {
    "boolean.yes": "はい",
    "boolean.no": "いいえ",
    "priority.selectUpTo": "最大",
    "priority.options": "個のオプションを選択",
    "priority.thenOrder": "その後並べ替えてください",
    "priority.selectOptions": "オプションを選択",
    "priority.cancel": "キャンセル",
    "priority.confirm": "確認",
    "priority.selectOptionNumber": "オプション # を選択",
    "priority.prioritized": "優先順位",
    "priority.of": "のうち",
    "priority.instruction": "優先順位リストは以下に表示されます。必要に応じて、矢印を使って選択肢を並べ替えることができます。「次へ」をクリックして選択を確定し、続行してください。"
};

const ZH: Locale = {
    "boolean.yes": "是",
    "boolean.no": "不",
    "priority.selectUpTo": "最多选择",
    "priority.options": "个选项",
    "priority.thenOrder": "然后排序它们",
    "priority.selectOptions": "选择选项",
    "priority.cancel": "取消",
    "priority.confirm": "确认",
    "priority.selectOptionNumber": "选择选项 #",
    "priority.prioritized": "已优先",
    "priority.of": "共",
    "priority.instruction": "你的优先列表如下所示。如有需要，可以使用箭头重新排序选项。点击“下一步”确认选择并继续。"
};

const KO: Locale = {
    "boolean.yes": "예",
    "boolean.no": "아니",
    "priority.selectUpTo": "최대",
    "priority.options": "개의 옵션 선택",
    "priority.thenOrder": "그런 다음 정렬하세요",
    "priority.selectOptions": "옵션 선택",
    "priority.cancel": "취소",
    "priority.confirm": "확인",
    "priority.selectOptionNumber": "옵션 # 선택",
    "priority.prioritized": "우선순위",
    "priority.of": "중",
    "priority.instruction": "우선순위 목록은 아래에 표시됩니다. 원한다면 화살표를 사용해 선택 항목을 재정렬할 수 있습니다. \"다음\"을 클릭하여 선택을 확인하고 계속하세요."
};

const LOCALES: Record<string, Locale> = {
    en: EN,
    es: ES,
    de: DE,
    fr: FR,
    pt: PT,
    da: DA,
    fi: FI,
    no: NO,
    sv: SV,
    ar: AR,
    bn: BN,
    it: IT,
    nl: NL,
    pl: PL,
    ru: RU,
    ja: JA,
    zh: ZH,
    ko: KO
};

/** Languages with a complete translation of every SDK string. */
export const SUPPORTED_LANGUAGES = ["en", "da", "fi", "no", "es", "sv", "ar", "bn", "de", "pt", "fr"];

/** Languages that resolve to a locale, including the partially translated ones. */
export const AVAILABLE_LANGUAGES = Object.keys(LOCALES);

/** Languages written right to left, for hosts that need to flip their layout. */
export const RTL_LANGUAGES = ["ar"];

// Norwegian and Chinese reach us under several tags; the survey editor stores
// 'no'/'zh', but a host passing navigator.language gives us 'nb-NO'/'zh-Hans'.
const ALIASES: Record<string, string> = {
    nb: "no",
    nn: "no",
    nob: "no",
    nno: "no",
    iw: "he",
    in: "id",
    cmn: "zh"
};

/** Locale key for a tag, or null when we have no locale for it at all. */
function resolveLocaleKey(language?: string | null): string | null {
    if (!language) return null;

    const tag = language.trim().toLowerCase().replace(/_/g, "-");
    if (!tag) return null;
    if (LOCALES[tag]) return tag;

    const primary = tag.split("-")[0];
    const aliased = ALIASES[primary] || primary;

    return LOCALES[aliased] ? aliased : null;
}

/**
 * Resolves any BCP-47-ish tag ('es', 'es-ES', 'pt_BR', 'nb-NO') to a locale key,
 * falling back to English when we have nothing for it.
 */
export function normalizeLanguage(language?: string | null): string {
    return resolveLocaleKey(language) || "en";
}

/** Every key the translation table defines. */
export const TRANSLATION_KEYS = Object.keys(EN) as TranslationKey[];

/** True when `language` translates `key` itself instead of falling back to English. */
export function hasOwnTranslation(language: string | undefined | null, key: TranslationKey): boolean {
    const localeKey = resolveLocaleKey(language);
    return !!localeKey && LOCALES[localeKey][key] !== undefined;
}

/** True when the language is written right to left. */
export function isRtlLanguage(language?: string | null): boolean {
    return RTL_LANGUAGES.indexOf(normalizeLanguage(language)) !== -1;
}

/** True when the language is fully translated (i.e. nothing falls back to English). */
export function isLanguageSupported(language?: string | null): boolean {
    const localeKey = resolveLocaleKey(language);
    return !!localeKey && SUPPORTED_LANGUAGES.indexOf(localeKey) !== -1;
}

function interpolate(text: string, params: Record<string, string | number>): string {
    return Object.keys(params).reduce(
        (acc, key) => acc.replace(new RegExp("\\{" + key + "\\}", "g"), String(params[key])),
        text
    );
}

/**
 * Translates `key` into `language`, interpolating `{token}` params.
 * Unknown languages and keys missing from a partial locale fall back to English.
 */
export function t(
    language: string | undefined | null,
    key: TranslationKey,
    params?: Record<string, string | number>
): string {
    const locale = LOCALES[normalizeLanguage(language)] || EN;
    const text = locale[key] !== undefined ? (locale[key] as string) : EN[key];

    return params ? interpolate(text, params) : text;
}
