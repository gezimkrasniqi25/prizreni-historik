/**
 * Editable site content, timeline, events and activities.
 * Every historical entry is taken from the same sources as the monument texts
 * (Wikipedia, Kosovo heritage database). Dates of recurring events are given as
 * recurrence labels instead of invented calendar dates.
 */

export const siteContent = {
  'hero.title': {
    sq: 'Prizren – Qyteti i Historisë dhe Kulturës',
    en: 'Prizren – City of History and Culture',
    de: 'Prizren – Stadt der Geschichte und Kultur',
  },
  'hero.subtitle': {
    sq: 'Në brigjet e Lumbardhit, nën gjurmën e Sharrit, Prizreni ruan shtresa historike nga Epoka e Bronzit deri te Rilindja Kombëtare. Eksploroni xhamitë, kishat, hamamin, urën e gurit dhe kalanë e qytetit që Kushtetuta e Kosovës e cakton si kryeqytet historik.',
    en: 'On the banks of the Lumbardh, at the foot of the Sharr Mountains, Prizren preserves layers of history from the Bronze Age to the National Renaissance. Explore the mosques, churches, hamam, stone bridge and fortress of the city that Kosovo’s constitution designates as its historical capital.',
    de: 'Am Ufer der Lumbardh, am Fuß des Šar-Gebirges, bewahrt Prizren Geschichtsschichten von der Bronzezeit bis zur Nationalen Wiedergeburt. Entdecken Sie Moscheen, Kirchen, Hamam, Steinbrücke und Festung der Stadt, die in der Verfassung des Kosovo als historische Hauptstadt festgelegt ist.',
  },
  'monuments.intro': {
    sq: 'Njëmbëdhjetë monumente që tregojnë se si bashkëjetuan në Prizren periudhat bizantine, mesjetare, osmane dhe moderne.',
    en: 'Eleven monuments that show how the Byzantine, medieval, Ottoman and modern periods coexisted in Prizren.',
    de: 'Elf Denkmäler, die zeigen, wie byzantinische, mittelalterliche, osmanische und moderne Epochen in Prizren nebeneinander bestehen.',
  },
  'history.intro': {
    sq: 'Prizreni është qyteti i dytë më i populluar i Kosovës. Gërmimet në Kalanë e Prizrenit tregojnë banim që nga Epoka e Bronzit; në antikitetin e vonë ishte pjesë e sistemit mbrojtës të Dardanisë perëndimore. Pas sundimit bizantin dhe atij mesjetar, nga viti 1455 u bë qendër e Sanxhakut të Prizrenit në Perandorinë Osmane, dhe në shekullin XIX qendër politike e Rilindjes Kombëtare shqiptare.',
    en: 'Prizren is the second most populous city in Kosovo. Excavations at Prizren Fortress show habitation since the Bronze Age; in late antiquity it was part of the defensive system of western Dardania. After Byzantine and medieval rule it became, from 1455, the centre of the Sanjak of Prizren in the Ottoman Empire, and in the 19th century a political centre of the Albanian National Renaissance.',
    de: 'Prizren ist die zweitgrößte Stadt des Kosovo. Grabungen in der Festung von Prizren belegen eine Besiedlung seit der Bronzezeit; in der Spätantike gehörte sie zum Verteidigungssystem des westlichen Dardanien. Nach byzantinischer und mittelalterlicher Herrschaft wurde sie ab 1455 Zentrum des Sandschaks Prizren im Osmanischen Reich und im 19. Jahrhundert ein politisches Zentrum der albanischen Nationalen Wiedergeburt.',
  },
  'explore3d.intro': {
    sq: 'Rrotullo, zmadho dhe studio formën e monumenteve në hapësirë. Modelet e shfaqura pa skanim autentik janë interpretime skematike dhe janë shënuar qartë si të tilla; kur administratori ngarkon një model të skanuar ose rindërtim të dokumentuar, ai shfaqet me burimin dhe licencën e tij.',
    en: 'Rotate, zoom and study the form of the monuments in space. Models without an authentic scan are schematic interpretations and are clearly labelled as such; when an administrator uploads a scanned model or a documented reconstruction, it appears with its source and licence.',
    de: 'Drehen, zoomen und studieren Sie die Form der Denkmäler im Raum. Modelle ohne authentischen Scan sind schematische Interpretationen und als solche klar gekennzeichnet; lädt ein Administrator ein gescanntes Modell oder eine dokumentierte Rekonstruktion hoch, erscheint es mit Quelle und Lizenz.',
  },
  'map.intro': {
    sq: 'Të gjitha monumentet në hartë. Kliko një shenjë për të parë emrin dhe fotografinë, hap faqen e detajuar ose merr udhëzime për të arritur atje.',
    en: 'All monuments on the map. Click a marker to see the name and photo, open the detailed page or get directions to get there.',
    de: 'Alle Denkmäler auf der Karte. Klicken Sie auf eine Markierung, um Name und Foto zu sehen, die Detailseite zu öffnen oder eine Wegbeschreibung zu erhalten.',
  },
  'activities.intro': {
    sq: 'Ide për ta jetuar qytetin: shëtitje në këmbë, pamje nga lart dhe festivale kulturore.',
    en: 'Ideas for experiencing the city: walks, views from above and cultural festivals.',
    de: 'Ideen, die Stadt zu erleben: Spaziergänge, Aussichten von oben und Kulturfestivals.',
  },
  'footer.about': {
    sq: 'Prizren Heritage është një udhëzues digjital për historinë dhe trashëgiminë kulturore të Prizrenit. Fotografitë janë nga Wikimedia Commons me licenca të hapura; tekstet bazohen në burime të përmendura në çdo faqe.',
    en: 'Prizren Heritage is a digital guide to the history and cultural heritage of Prizren. Photos come from Wikimedia Commons under open licences; texts are based on the sources listed on each page.',
    de: 'Prizren Heritage ist ein digitaler Führer zur Geschichte und zum Kulturerbe von Prizren. Die Fotos stammen von Wikimedia Commons unter offenen Lizenzen; die Texte beruhen auf den auf jeder Seite genannten Quellen.',
  },
};

// monument = slug of the related monument (optional)
export const timeline = [
  {
    monument: 'kalaja-e-prizrenit',
    sq: { whenLabel: 'Rreth 2000 p.e.s.', title: 'Banimi i parë në kodrën e Kalasë', description: 'Gërmimet arkeologjike dokumentojnë një vendbanim parahistorik në vendin e Kalasë, të datuar në Epokën e Bronzit.' },
    en: { whenLabel: 'c. 2000 BCE', title: 'First settlement on the Fortress hill', description: 'Archaeological excavations document a prehistoric settlement on the site of the Fortress, dated to the Bronze Age.' },
    de: { whenLabel: 'um 2000 v. Chr.', title: 'Erste Siedlung auf dem Festungshügel', description: 'Archäologische Grabungen belegen am Ort der Festung eine vorgeschichtliche Siedlung aus der Bronzezeit.' },
  },
  {
    monument: 'kalaja-e-prizrenit',
    sq: { whenLabel: 'Shek. VI', title: 'Petrizen në kohën e Justinianit', description: 'Fortifikimi rindërtohet në kohën e perandorit Justinian dhe, sipas të gjitha gjasave, del në veprën e Prokopit me emrin Petrizen.' },
    en: { whenLabel: '6th century', title: 'Petrizen in Justinian’s era', description: 'The fortification is rebuilt in the era of Emperor Justinian and most likely appears in Procopius’ work under the name Petrizen.' },
    de: { whenLabel: '6. Jahrhundert', title: 'Petrizen unter Justinian', description: 'Die Befestigung wird unter Kaiser Justinian wiederaufgebaut und erscheint höchstwahrscheinlich bei Prokopios unter dem Namen Petrizen.' },
  },
  {
    sq: { whenLabel: '1019', title: 'Përmendja e parë e emrit të sotëm', description: 'Prizreni i sotëm përmendet për herë të parë në vitin 1019, në kohën e Vasilit II, në formën “Prisdriana”.' },
    en: { whenLabel: '1019', title: 'First mention of the present-day name', description: 'Present-day Prizren is first mentioned in 1019, at the time of Basil II, in the form “Prisdriana”.' },
    de: { whenLabel: '1019', title: 'Erste Erwähnung des heutigen Namens', description: 'Das heutige Prizren wird erstmals 1019 zur Zeit Basileios’ II. in der Form „Prisdriana“ erwähnt.' },
  },
  {
    monument: 'kisha-e-shen-premtes',
    sq: { whenLabel: '1306/07', title: 'Rindërtimi i Bogorodica Ljeviškës', description: 'Mbreti Stefan Milutin e rindërton kishën mbi një bazilikë bizantine të shek. XI, me afreske të Mihail dhe Eutihije Astrapas.' },
    en: { whenLabel: '1306/07', title: 'Rebuilding of Bogorodica Ljeviška', description: 'King Stefan Milutin rebuilds the church on an 11th-century Byzantine basilica, with frescoes by Michael and Eutychios Astrapas.' },
    de: { whenLabel: '1306/07', title: 'Wiederaufbau der Bogorodica Ljeviška', description: 'König Stefan Milutin lässt die Kirche über einer byzantinischen Basilika des 11. Jahrhunderts neu errichten, mit Fresken von Michael und Eutychios Astrapas.' },
  },
  {
    sq: { whenLabel: '1455', title: 'Sundimi osman', description: 'Osmanët e marrin Prizrenin dhe qyteti bëhet qendër e Sanxhakut të Prizrenit. Kisha Bogorodica Ljeviška shndërrohet në xhami.' },
    en: { whenLabel: '1455', title: 'Ottoman rule', description: 'The Ottomans capture Prizren and the town becomes the centre of the Sanjak of Prizren. The church of Bogorodica Ljeviška is converted into a mosque.' },
    de: { whenLabel: '1455', title: 'Osmanische Herrschaft', description: 'Die Osmanen erobern Prizren, die Stadt wird Zentrum des Sandschaks Prizren. Die Kirche Bogorodica Ljeviška wird in eine Moschee umgewandelt.' },
  },
  {
    monument: 'xhamia-e-sinan-pashes',
    sq: { whenLabel: '1615', title: 'Xhamia e Sinan Pashës', description: 'Sofi Sinan Pasha ndërton xhaminë me kupolë që do të bëhet një nga simbolet e siluetës së qytetit.' },
    en: { whenLabel: '1615', title: 'Sinan Pasha Mosque', description: 'Sofi Sinan Pasha builds the domed mosque that becomes one of the symbols of the city skyline.' },
    de: { whenLabel: '1615', title: 'Sinan-Pascha-Moschee', description: 'Sofi Sinan Pascha errichtet die Kuppelmoschee, die zu einem Wahrzeichen der Stadtsilhouette wird.' },
  },
  {
    monument: 'xhamia-e-emin-pashes',
    sq: { whenLabel: '1831', title: 'Xhamia e Emin Pashës', description: 'Emin Pasha ndërton xhaminë në lagjen Saraçhane; mbishkrimi mbi derën hyrëse dëshmon vitin e ndërtimit.' },
    en: { whenLabel: '1831', title: 'Emin Pasha Mosque', description: 'Emin Pasha builds the mosque in the Saraçhane quarter; the inscription above the entrance door confirms the year of construction.' },
    de: { whenLabel: '1831', title: 'Emin-Pascha-Moschee', description: 'Emin Pascha errichtet die Moschee im Viertel Saraçhane; die Inschrift über dem Eingangstor bestätigt das Baujahr.' },
  },
  {
    monument: 'kisha-e-shen-gjergjit',
    sq: { whenLabel: '1856–1887', title: 'Katedralja e Shën Gjergjit', description: 'Pas lejes së vitit 1855, themelet hidhen në 1856 dhe katedralja shugurohet në 1887.' },
    en: { whenLabel: '1856–1887', title: 'Saint George Cathedral', description: 'After permission in 1855, the foundations are laid in 1856 and the cathedral is consecrated in 1887.' },
    de: { whenLabel: '1856–1887', title: 'Kathedrale des Heiligen Georg', description: 'Nach der Genehmigung 1855 wird 1856 der Grundstein gelegt, 1887 wird die Kathedrale geweiht.' },
  },
  {
    monument: 'katedralja-e-zojes-ndihmetare',
    sq: { whenLabel: '1870', title: 'Katedralja e Zojës Ndihmëtare', description: 'Kryepeshkopi Dario Bucciarelli porosit ndërtimin e katedrales katolike; ajo shugurohet më 1970.' },
    en: { whenLabel: '1870', title: 'Cathedral of Our Lady of Perpetual Succour', description: 'Archbishop Dario Bucciarelli commissions the Catholic cathedral; it is consecrated in 1970.' },
    de: { whenLabel: '1870', title: 'Kathedrale Unserer Lieben Frau von der Immerwährenden Hilfe', description: 'Erzbischof Dario Bucciarelli gibt die katholische Kathedrale in Auftrag; sie wird 1970 geweiht.' },
  },
  {
    monument: 'lidhja-shqiptare-e-prizrenit',
    sq: { whenLabel: '10 qershor 1878', title: 'Themelimi i Lidhjes së Prizrenit', description: 'Delegatë nga vilajetet shqiptare mblidhen në Prizren dhe themelojnë Lidhjen për mbrojtjen e të drejtave të kombit shqiptar.' },
    en: { whenLabel: '10 June 1878', title: 'Founding of the League of Prizren', description: 'Delegates from the Albanian-inhabited vilayets meet in Prizren and found the League for the Defense of the Rights of the Albanian Nation.' },
    de: { whenLabel: '10. Juni 1878', title: 'Gründung der Liga von Prizren', description: 'Delegierte aus den albanisch besiedelten Vilayets treffen sich in Prizren und gründen die Liga zur Verteidigung der Rechte der albanischen Nation.' },
  },
  {
    sq: { whenLabel: '1912', title: 'Fundi i sundimit osman', description: 'Në Luftën e Parë Ballkanike përfundon sundimi osman; në vjeshtën e vitit 1912 Prizreni aneksohet nga Mbretëria e Serbisë.' },
    en: { whenLabel: '1912', title: 'End of Ottoman rule', description: 'Ottoman rule ends in the First Balkan War; in autumn 1912 Prizren is annexed by the Kingdom of Serbia.' },
    de: { whenLabel: '1912', title: 'Ende der osmanischen Herrschaft', description: 'Im Ersten Balkankrieg endet die osmanische Herrschaft; im Herbst 1912 wird Prizren vom Königreich Serbien annektiert.' },
  },
  {
    monument: 'ura-e-gurit',
    sq: { whenLabel: '1979–1982', title: 'Ura e Gurit shkatërrohet dhe rindërtohet', description: 'Përmbytja e nëntorit 1979 e shkatërron urën; banorët mobilizohen dhe ura e rindërtuar inaugurohet më 17 nëntor 1982.' },
    en: { whenLabel: '1979–1982', title: 'The Stone Bridge is destroyed and rebuilt', description: 'The November 1979 flood destroys the bridge; residents mobilise and the rebuilt bridge is inaugurated on 17 November 1982.' },
    de: { whenLabel: '1979–1982', title: 'Die Steinbrücke wird zerstört und wiederaufgebaut', description: 'Die Flut vom November 1979 zerstört die Brücke; die Einwohner mobilisieren sich, die wiederaufgebaute Brücke wird am 17. November 1982 eingeweiht.' },
  },
  {
    monument: 'lidhja-shqiptare-e-prizrenit',
    sq: { whenLabel: '1999–2000', title: 'Rindërtimi i Rezidencës së Lidhjes', description: 'Ndërtesa e Rezidencës Qeveritare të Lidhjes digjet gjatë luftës së vitit 1999 dhe rindërtohet në qershor 2000.' },
    en: { whenLabel: '1999–2000', title: 'Rebuilding of the League’s Residence', description: 'The League’s Government Residence burns down during the 1999 war and is rebuilt in June 2000.' },
    de: { whenLabel: '1999–2000', title: 'Wiederaufbau der Residenz der Liga', description: 'Das Gebäude der Regierungsresidenz der Liga brennt im Krieg 1999 nieder und wird im Juni 2000 wiederaufgebaut.' },
  },
  {
    monument: 'kisha-e-shen-premtes',
    sq: { whenLabel: '2006', title: 'Trashëgimia Botërore e UNESCO-s', description: 'Më 13 korrik 2006 Bogorodica Ljeviška përfshihet në Vendin e Trashëgimisë Botërore “Monumentet mesjetare në Kosovë”.' },
    en: { whenLabel: '2006', title: 'UNESCO World Heritage', description: 'On 13 July 2006 Bogorodica Ljeviška is included in the World Heritage Site “Medieval Monuments in Kosovo”.' },
    de: { whenLabel: '2006', title: 'UNESCO-Welterbe', description: 'Am 13. Juli 2006 wird die Bogorodica Ljeviška in das Welterbe „Mittelalterliche Denkmäler im Kosovo“ aufgenommen.' },
  },
];

export const events = [
  {
    link: 'https://dokufest.com',
    sq: { whenLabel: 'Çdo vit, në fillim të gushtit', title: 'DokuFest', description: 'Festival ndërkombëtar i filmit dokumentar dhe të shkurtër, i themeluar në vitin 2002 nga një grup miqsh. Filmat shfaqen gjatë tetë ditëve, së bashku me programe, aktivitete dhe punëtori.' },
    en: { whenLabel: 'Every year, in early August', title: 'DokuFest', description: 'An international documentary and short film festival founded in 2002 by a group of friends. Films are screened across eight days, accompanied by programmes, activities and workshops.' },
    de: { whenLabel: 'Jedes Jahr, Anfang August', title: 'DokuFest', description: 'Ein internationales Dokumentar- und Kurzfilmfestival, 2002 von einer Gruppe Freunden gegründet. Die Filme laufen über acht Tage, begleitet von Programmen, Aktivitäten und Workshops.' },
  },
  {
    monument: 'lidhja-shqiptare-e-prizrenit',
    sq: { whenLabel: '10 qershor', title: 'Përvjetori i Lidhjes së Prizrenit', description: 'Data kur, në vitin 1878, u themelua Lidhja e Prizrenit. Kompleksi i Lidhjes mund të vizitohet për të mësuar historinë e saj.' },
    en: { whenLabel: '10 June', title: 'Anniversary of the League of Prizren', description: 'The date on which the League of Prizren was founded in 1878. The League complex can be visited to learn about its history.' },
    de: { whenLabel: '10. Juni', title: 'Jahrestag der Liga von Prizren', description: 'Das Datum, an dem 1878 die Liga von Prizren gegründet wurde. Der Komplex der Liga kann besucht werden, um mehr über ihre Geschichte zu erfahren.' },
  },
];

export const activities = [
  {
    monument: 'kalaja-e-prizrenit',
    sq: { whenLabel: 'Gjatë gjithë vitit', title: 'Ngjitja te Kalaja', description: 'Një shteg nga qendra të çon te kalaja; ecja zgjat rreth 15 minuta. Nga lart shihet qyteti i vjetër, lugina e Lumbardhit dhe perëndimi i diellit.' },
    en: { whenLabel: 'All year round', title: 'Walk up to the Fortress', description: 'A path leads from the centre up to the fortress; the walk takes about 15 minutes. From the top you see the old town, the Lumbardh valley and the sunset.' },
    de: { whenLabel: 'Ganzjährig', title: 'Aufstieg zur Festung', description: 'Ein Pfad führt vom Zentrum zur Festung; der Aufstieg dauert etwa 15 Minuten. Von oben sehen Sie die Altstadt, das Lumbardh-Tal und den Sonnenuntergang.' },
  },
  {
    monument: 'ura-e-gurit',
    sq: { whenLabel: 'Gjatë gjithë vitit', title: 'Rruga historike në këmbë', description: 'Një shëtitje e shkurtër lidh Shadërvanin, Xhaminë e Sinan Pashës, Urën e Gurit, Saraçhanën (Teqen e Halvetive, Hamamin dhe Xhaminë e Emin Pashës), Kompleksin e Lidhjes dhe Marashin.' },
    en: { whenLabel: 'All year round', title: 'The historic walking route', description: 'A short walk links Shadervan, the Sinan Pasha Mosque, the Stone Bridge, Saraçhane (Halveti Tekke, the Hamam and the Emin Pasha Mosque), the League complex and Marash.' },
    de: { whenLabel: 'Ganzjährig', title: 'Der historische Rundgang', description: 'Ein kurzer Spaziergang verbindet Shadervan, die Sinan-Pascha-Moschee, die Steinbrücke, Saraçhane (Halveti-Tekke, Hamam und Emin-Pascha-Moschee), den Komplex der Liga und Marash.' },
  },
  {
    monument: 'kompleksi-i-marashit',
    sq: { whenLabel: 'Gjatë gjithë vitit', title: 'Pushim nën rrapin e Marashit', description: 'Ambienti i Marashit, me rrapin shekullor, ofron një pushim të qetë buzë Lumbardhit pas vizitës së qytetit të vjetër.' },
    en: { whenLabel: 'All year round', title: 'A rest under the Marash plane tree', description: 'The Marash setting, with its centuries-old plane tree, offers a quiet rest by the Lumbardh after visiting the old town.' },
    de: { whenLabel: 'Ganzjährig', title: 'Rast unter der Marash-Platane', description: 'Die Umgebung von Marash mit ihrer jahrhundertealten Platane bietet nach dem Besuch der Altstadt eine ruhige Rast an der Lumbardh.' },
  },
];
