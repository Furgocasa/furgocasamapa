/**
 * Script para comparar usuarios antiguos con usuarios actuales en Supabase
 * y devolver la lista de nuevos usuarios
 * 
 * Uso:
 *   node scripts/compare-users.js [archivo-usuarios-antiguos.json]
 * 
 * Si no se proporciona archivo, se puede pegar la lista directamente en el código
 * o el script pedirá la lista por consola.
 * 
 * Requiere:
 *   - NEXT_PUBLIC_SUPABASE_URL en .env.local
 *   - SUPABASE_SERVICE_ROLE_KEY en .env.local
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
const XLSX = require('xlsx')

/**
 * Función para normalizar nombres: quitar tildes y caracteres especiales
 */
function normalizarNombre(nombre) {
  if (!nombre) return ''

  // Mapa de caracteres con tilde a sin tilde
  const mapaTildes = {
    'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u',
    'Á': 'A', 'É': 'E', 'Í': 'I', 'Ó': 'O', 'Ú': 'U',
    'ñ': 'n', 'Ñ': 'N',
    'ü': 'u', 'Ü': 'U',
    'ç': 'c', 'Ç': 'C'
  }

  // Reemplazar caracteres con tilde
  let normalizado = nombre
  for (const [conTilde, sinTilde] of Object.entries(mapaTildes)) {
    normalizado = normalizado.replace(new RegExp(conTilde, 'g'), sinTilde)
  }

  // Limpiar espacios múltiples y trim
  normalizado = normalizado.replace(/\s+/g, ' ').trim()

  return normalizado
}

/**
 * Función para parsear la lista de usuarios antiguos desde texto plano
 * Formato esperado: "Nombre"	email@example.com (separado por tabulación)
 */
function parseOldUsersList(text) {
  const lines = text.trim().split('\n')
  const users = []

  for (const line of lines) {
    if (!line.trim()) continue

    // Separar por tabulación o múltiples espacios
    const parts = line.split('\t').map(p => p.trim()).filter(p => p)

    if (parts.length >= 2) {
      const email = parts[parts.length - 1].toLowerCase().trim()
      const name = parts.slice(0, -1).join(' ').trim()

      if (email && email.includes('@')) {
        users.push({
          email: email,
          name: name
        })
      }
    }
  }

  return users
}

/**
 * Función para leer usuarios antiguos desde archivo JSON o texto
 */
function loadOldUsers(filePath) {
  if (!filePath) {
    return null
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8')

    // Intentar parsear como JSON primero
    try {
      const json = JSON.parse(content)
      if (Array.isArray(json)) {
        return json.map(u => ({
          email: (u.email || u.Email || u.email_address || '').toLowerCase().trim(),
          name: u.name || u.Name || u.nombre || ''
        })).filter(u => u.email && u.email.includes('@'))
      }
    } catch (e) {
      // Si no es JSON, intentar como texto plano
      return parseOldUsersList(content)
    }
  } catch (error) {
    console.error(`❌ Error leyendo archivo ${filePath}:`, error.message)
    return null
  }
}

async function compareUsers() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🔍 COMPARACIÓN DE USUARIOS')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  // Verificar variables de entorno
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    console.error('❌ ERROR: NEXT_PUBLIC_SUPABASE_URL no encontrada en .env.local')
    process.exit(1)
  }

  if (!supabaseServiceKey) {
    console.error('❌ ERROR: SUPABASE_SERVICE_ROLE_KEY no encontrada en .env.local')
    process.exit(1)
  }

  console.log('✅ Variables de entorno encontradas')
  console.log(`   📍 URL: ${supabaseUrl}`)
  console.log(`   🔑 Service Key: ${supabaseServiceKey.substring(0, 20)}...\n`)

  // Cargar usuarios antiguos
  const filePath = process.argv[2]
  let oldUsers = null

  if (filePath) {
    console.log(`📂 Leyendo usuarios antiguos desde: ${filePath}\n`)
    oldUsers = loadOldUsers(filePath)
  } else {
    // Si no hay archivo, usar la lista hardcodeada en el script
    console.log('📋 Usando lista de usuarios antiguos del código...\n')

    // Pegar aquí la lista de usuarios antiguos
    const oldUsersText = `"Abel Hernández Pérez "	abelhernandezerick@gmail.com
acampostru	acampostru@bizkaia.eu
Acttax Fiscal y Tributario	contacto@acttax.es
Ade	adelam70@gmail.com
Adm gran sol	adm.gransol@gmail.com
Adrián Parra Bastian 	adrianparra01@hotmail.com
Agustín Dacuña	aads61@hotmail.com
Aingeru (udal600)	udal600@gmail.com
Aitor Polo Lizundia 	aipoli1977@gmail.com
Albert Muñoz	aemeygriega@gmail.com
Alejandra Spuch Blanco	alexmaragata@gmail.com
Alejandro	adelarivagarcia@gmail.com
Alejandro Pardo	mestasdeejay@gmail.com
Alexasus 	alexasusasus@gmail.com
Alexia	alexiaponce@hotmail.es
alfadiscovery 	alfadiscovery@gmail.com
Alfonso	alfonsoarregui@hotmail.com
alfonso gutierrez	ajgcmonuco@gmail.com
Alfonso P	ciberapc@hotmail.com
Alicia	calzadosbugatti@hotmail.com
Aliwapa	jj68alicante@gmail.com
Almadecamper	sgarciacayero@outlook.es
Ama Santos	anasb69@gmail.com
Amni	garciasanchezbelmonte@gmail.com
Amsellu Amsellu 	amsellu@gmail.com
Ana	anaromeroestefania@gmail.com
Ana C.	anacorrales4@gmail.com
Ana Cutillas	anaisabel31a@gmail.com
Ana Doyague	a_doyague@hotmail.com
Ana Jiménez	anina7407@gmail.com
Ana Maria  López Campos 	anamarimelilla@gmail.com
Ana Oliva	anamariaolivarescalvo@gmail.com
ana paula de esteban	anapauladeesteban@gmail.com
Ana Santiago 	absantiagos@hotmail.com
AnderDiez	anderdiez84@gmail.com
Andertxu Rutero	anderpre@hotmail.com
Andrés 	anpachec@ucm.es
ANDRES MIKULAK	ma57es@gmail.com
Angel	angelmtzcondediaz@gmail.com
Angel Fernandez	angelferdzinserta@gmail.com
Angel Gonzalez Rodríguez	agrecso@gmail.com
Angel Rodriguez	anrona56@hotmail.com
angel rodriguez	clinicadentalelcarmen@gmail.com
Angel Sanchez 	angel.saloa@gmail.com
Angeles 	angel_fabe@hotmail.com
Angeles62	angelesfbus@hotmail.com
Angels	angelspatch@gmail.com
Ani	anuskatrabu@gmail.com
antalvarezrojas@hotmail.com	antalvarezrojas@hotmail.com
Antonio 	apoyato58@gmail.com
"Antonio  Ambrosino "	toniacannas@gmail.com
"Antonio  Sánchez Sanchez"	sanchez_46@msn.com
Antonio J. Gallardo	gallardofuengirola@gmail.com
ANTONIO MORENO	amoreno_64@hotmail.com
Antonio Murcia	an.murcia@hotmail.com
Antonio Navarrete Gómez	antonionavarretegomez9@gmail.com
Antonio Padilla	apadillalopez18@gmail.com
ARG	antonio_rivas_garcia@hotmail.com
Arturo Fernández	danau_13@hotmail.com
Asuncion 	18marufrlz@gmail.com
Aucatiana Martínez	aucatianamn@gmail.com
"Aurora  Fernández Martino "	picojario1@hotmail.com
Baranda 	dvalle-88@hotmail.es
Barón 581	gallegoauxi75@gmail.com
Baticamper	emiliojpn@gmail.com
Bea	bperez_martinez@yahoo.es
Begoña Berenguer	beberenguer@gmail.com
"Belén  Rodríguez "	mbelenrj@hotmail.es
Bemigar	garciabeatriz1@hotmail.com
Benimar497	lafurgui497@gmail.com
Benros	benitorua70@gmail.com
Birelrotax	luismarug@hotmail.com
BIVAN	albertoip89@gmail.com
Blas Casas 	blas_casas@hotmail.es
Blueberry	jesuaaf@hotmail.com
BONI 	boniginer1976@gmail.com
BRAULIO RODRIGUEZ  MATEOS	brauliorm1@hotmail.com
BrianC 	brimad@gmail.com
Bustabad 	salcris49@gmail.com
C-ris	cristinaramirezguijarro@hotmail.com
Californiabeacht61	dm.10@hotmail.com
Camelia Cătălina Sarosi	cameliacatalinasarosi@yahoo.es
Capybara 	machaquitos@gmail.com
Carlos Guay	carlos_guay_gayc@hotmail.com
CARLOS SANCHEZ GARCIA	sanchezgarciaestepona@gmail.com
Carlos Suárez 	casumo2@hotmail.com
Carme	nilumali@hotmail.es
Carmen	carmenpastor-@hotmail.com
Carmen  	sssevilla7@hotmail.com
Carmen Baños Cuello 	grisines@hotmail.es
Carmen Prado	maluan29.31@gmail.com
Carmen Sch	niblumen@yahoo.es
Carmen Vicent Corella 	carmen96rbs@gmail.com
Carol	carolmoreno221183@gmail.com
Carrasca	autocaravana1956@gmail.com
Catalina Carrasco	catleon14@gmail.com
Cati	catifernandez40@gmail.com
Celestino Méndez 	caelestinum58@gmail.com
Challenger 398	josefinstelvent@gmail.com
Charo	rosarioplagil1@gmail.com
Cheema	chemacivicosrodriguez@gmail.com
Churricorme	carloscorme1970@gmail.com
Chus Rodriguez	esgos.ch@hotmail.com
Clara Cabrera 	ccm2008@hotmail.com
Conchi 92	conchi6106@gmail.com
Cris	criss1971@hotmail.com
Cristi a	domencris@gmail.com
Cristian	cristian.gras.manzano@gmail.com
"Cristina  Benedicto Perea"	cristinabenedictoperea@gmail.com
CRISTINA Ruperez BERNAT	cruperezbernat@yahoo.es
Cristy	khris110766@gmail.com
CrisyJoaquin	cristinaaherraanzlucenaa@gmail.com
Cruz	cruzcamachom@gmail.com
dagarciag84	dagarciag84@gmail.com
Daniel Carrasco Cantero	dcarrasco@cmtbc.es
Daniel Tizon	crunadan@gmail.com
dario barrios	dariouy2004@gmail.com
Daruqui	ruthlillo5@gmail.com
Darwin Falero	niwradorelaf@gmail.com
"David  Machado Herrezuelo "	david_mahe2011@hotmail.com
"David  Marabel "	davidsuizo1@hotmail.com
David Alzola	davidalzola36@gmail.com
David Molina 	molinamanzano@gmail.com
David Ojeda	davidojedaguerra@hotmail.com
David1982_	e_david85@hotmail.com
David3214	davidvk321@gmail.com
Davidysonia	akicarre79@hotmail.com
Désirée 	macrolopez@hotmail.com
"Desireé  García olivero"	duchy_@hotmail.com
didipa	didipalas@gmail.com
Dolors Grilló Dorca	dolorsgd25@hotmail.com
Domènec Farell Benlloch	domenecf@gmail.com
domifer	domifer@gmail.com
Domingo Conesa	conesadomingo@gmail.com
Domingo Rguez.	tessoro494tenerife@gmail.com
Drv	domingoramirezvega@hotmail.com
Dulce Castellano Fernández	dulcecadora@yahoo.es
Eduard Ginesta Sendra	eginestasen@gmail.com
Eduardo Figueroa	figueroapereze@yahoo.es
Eduqueen1971	edusamole@hotmail.com
El hombre del sacus	maluor1961@hotmail.com
Elbrujillo	elbrujillo@gmail.com
Elena	elen_itxu@hotmail.com
emilioherbi	emilioherbi@gmail.com
Endika Haro	endikampuero4@hotmail.com
Enrique Alcalde 	enriquealcser@gmail.com
enriquezguille	enriquezguillermo@hotmail.com
Esdivi	esdivi@hotmail.com
Esmimo	juancarlosgarciaa@hotmail.com
Esteban	escous@hotmail.es
Esteban Bautista	clubciclistalaescapada@hotmail.com
Esteban Pizarro (coustodio)	escous70@gmail.com
Estefania Martinez navarro	fanimart@hotmail.com
Ester	esterg-g@hotmail.es
Esther Rivas 	martinrivas.maria@gmail.com
Eva	evatablet1966@gmail.com
Eva Seguin Bilbao	oihaneva1@hotmail.com
Evelin 	ecuma79@hotmail.com
Fabi	fabi199@hotmail.es
fabio votino	fabiovotino@gmail.com
Fabry	fabryhd@gmail.com
Febrieste 	febrieste@gmail.com
Feito De Pau	feitodepaucontacto@gmail.com
Feli	feli_barco@hotmail.com
Felipe Hernandez	siluet800@hotmail.com
Felix	w0240@hotmail.com
Fermin Goldaratzena	turkino@hotmail.com
Ferminnn	quijada55@gmail.com
Fernando 	fernandoguerram@hotmail.com
Fernando Avila Piña	fanautilus@gmail.com
Fernando García Merencio	fernandogmerencio@gmail.com
Fernando López López	lopezdebullas@gmail.com
Fernando Márquez	fmarquezr73@gmail.com
Fernando Martinez perez	aincarpa@hotmail.com
FERNANDO SANCHEZ CEDRUN	camperparkaldaia@gmail.com
Fin63	fin63@hotmail.com
Fjgonzalez 	wiko81@gmail.com
Fonso	monuco@hotmail.com
Fran	fran.azu@hotmail.com
"Fran  Blazquez Castaño"	franblazquez03@gmail.com
Fran Barroso	ffranbarroso@hotmail.com
Francisco	francisalconchel@fmail.com
Francisco Jesús Oliva Garrido	franjesus22@icloud.com
Francisco Jose Diaz	francisco.diaz@boraboracamper.com
francisco oto	siscooto@gmail.com
Francisco Sanchez Millan	paquitosanchez.1414@gmail.com
Frankiwind	franmcweb@hotmail.com
franynada	franynada@gmail.com
Gabriele	el.luxen@gmail.com
Galápago	gtriguerosdefuentes@hotmail.com
Galia Barcenilla	mariolamorenovelazquez@gmail.com
Gar G	gari46@gmail.com
Gaudillat 	fgaudillat@gmail.com
gefrasa@hotmail.com	gefrasa@hotmail.com
GemmaSR	unaxdas@gmail.com
Gine	gine_5@hotmail.com
Gladys Teresa Cruz Molina	gladyscruzmol@gmail.com
Gloria 	esagloria83@hotmail.com
Gloria Suarez	gloria_msm@hotmail.com
Gorkaravan 	gorkaravan@gmail.com
Gregorio Herrero	acyogoir@gmail.com
Guapachosa	garciavalera@yahoo.es
guaymara ruiz	nekane_006@hotmail.com
Guille Soares torrubia	gstorrubia49@gmail.com
Guillermo Egido 	pacopil1969@gmail.com
Hakuna matata	marimarguer1_@hotmail.com
Helena Monforte	monfortecalvohelena@gmail.com
HERIBERTO 	hguanche@hotmail.com
Heros10	inflaccion@gmail.com
Hipolita 	hipolitasanchez@gmail.com
"Hugo  Dayuto "	hugodafy@vera.com.uy
Hugo Ignacio De la coba 	hugo.delacoba@gmail.com
Ianire_	ianireperez@hotmail.es
Iceman	juanjo291169@gmail.com
Iñaki 	jicanales57@gmail.com
Inma	iniciativalaboral@hotmail.com
INMA barcelo	inmaba8@hotmail.com
Inma Fernández Santos	infersan1963@gmail.com
Iosa Moreno	iosamoreno@gmail.com
Isa	isalopez81@hotmail.com
Isaac Vidal Núñez	mordedor46@gmail.com
Isabel	donaire7@hotmail.es
Isabel Bajo vinagre	isabelbajo1970@gmail.com
Isabel55	fitilandia1@hotmail.com
Isi Cuevas	icuegon@gmail.com
Isidoro Cabezas	cabezastuexsa@gmail.com
Ismael García	ismaelgarciabarbero3@gmail.com
Ivan	ivaniglesiaslastra@hotmail.com
Ivan Fernández 	dukepola@gmail.com
Ivan Gutierrez	medinarr6@gmail.com
ivan iglesias	ivaniglesiaslastra.ii@gmail.com
Izaskun Solaguren	ikakuns@hotmail.com
Izkander	izkandersondika@hotmail.com
J.Serrano	muriano43@gmail.com
Jabato	yagocaballerojavier@gmail.com
JAIME GURREA	jaimegurrea84@gmail.com
Jaime Lopez Tamayo	infojltl@gmail.com
Jarranz	jarranzsanz4@gmail.com
Javi	pierainstruments@gmail.com
Javi Casado	javisoinua@gmail.com
Javiato	arceblasjavier@gmail.com
JaviBau	btjavier71@gmail.com
Javier 	fjllm2009@gmail.com
javier callejas	javicallejas@gmail.com
Javier Cardiel Linde	jacarlin@gmail.com
Javier Garro	fjaviergarro@gmail.com
Javier Garro	fcogarro2@gmail.com
Javier Gutierrez	javitoaraceli@gmail.com
Javier Ripoll	javier_ripoll@hotmail.es
JC FN	golfmc75@gmail.com
Jessica 	jessisoler@gmail.com
Jesus	jesusmanuelfs@gmail.com
Jesús 	jesuslasoegido@hotmail.com
"Jesús  Honorato penis"	jesushonoratopenis@gmail.com
Jesús Mari 	jesusmarilarrazabal@gmail.com
Jesús Meca Valero	jmecav@hotmail.com
Jim83	jimenez20_10@hotmail.com
jnitwjfsht	wvdxuyfk@testform.xyz
Joana	canodellanos@gmail.com
joanacarmona00@gmail.com	joanacarmona00@gmail.com
Jon Adcock	jononead@icloud.com
Jonathan Perez Cordero	jonpe77@gmail.com
Joni77	kattuxo@hotmail.com
Jopi	jcurro74@gmail.com
Jordi	jordi.curtichs@icloud.com
Jordi Pallès	jordikei23@gmail.com
Jorge del Barrio Garcés	jorgedelbarrio56@gmail.com
Jorge Manzano	jorgemanzano90@hotmail.com
Jorizas	jgsudupe@hotmail.com
Jose	dexonsis@hotmail.com
"José  Manuel  "	jm28105@hotmail.com
"Jose  Rodriguez "	ciriaco14@hotmail.com
"JOSÉ Antonio Molina"	j.a.molinafer@hotmail.com
José Antonio  Franquelo Gomez 	joseantoniofranquelogomez@gmail.com
Jose antonio CASADO	joseantoniocasado1959@gmail.com
José Antonio Galvan Jurado	jgalvanjurado09@gmail.com
Jose Antonio Jiménez Botella	josetejimenezsanse@gmail.com
Jose Aurelio Pina Romero	pinamix@gmail.com
Jose Barja	jmbf31@gmail.com
Jose Bautista 	pep_pepe@hotmail.com
José Carlos	sanjuanjosecarlos@gmail.com
Jose Exro	publi.expcam@gmail.com
Jose Felix Lara Vizcsono	jf.lara.v@gmail.com
José Francisco López Lupiáñez	jflupi7@hotmail.com
jose francisco Mas Cervera	josefr.mas57@gmail.com
Jose Garliz	jgarliz70.jg@gmail.com
José juan Climent	pepe@pepeclimentmobiliario.com
Jose Juan Ortin	jotaortin@gmail.com
Jose Junquera Parodi	ojito112@hotmail.com
José Luis Nualart	nualix@gmail.com
jose Mª mateo Perez	jm.mateo@live.com
José Manuel Ibáñez Jiménez	gaspimoron@hotmail.com
José María García Martín	tuareg4x4@hotmail.com
José Maria gómez López 	alumijose@hotmail.com
José Marina Ovalle 	jmomarina78@gmail.com
jose martinez	el.jose.cxm@gmail.com
Jose Miguel Ayala	josemiguelayalaruiz@gmail.com
Jose Rodríguez Flores	ratonejos@gmail.com
Jose Serrano	danielaserranomoreno11@gmail.com
Josele	jfreireleon@yahoo.es
JOSELIN	jluismiguelb@gmail.com
Joselito	joseluisavilamtb@gmail.com
joselu_txotxe  	txulyto@gmail.com
JosenVan 	pptorresgarcia@gmail.com
josepol26@hotmail.com	josepol26@hotmail.com
JoseyLou	josefrf68@gmail.com
Josito	aluminiossantacruz2005@gmail.com
jperb17	jperb17@gmail.com
Jrutero	jmn.miron@gmail.com
Juan 	katatum.jcpm@gmail.com
"Juan  García "	juangarcia@gmail.com
Juan antonio Bestard planiol	jabestard@hotmail.com
Juan Carlos Carlin Castro	solraccd77@gmail.com
Juan Mera calvo	juanmeracalvo@gmail.com
Juan Recimil	jrecimil@hotmail.com
Juana	yohannijunquera@gmail.com
Juanca	jcrocac@mundo-r.com
JUANJE	juanjesus06@yahoo.es
Juanjo71	jjduranparis@gmail.com
Juannevis	juanktm@gmail.com
JUCABA	jucaba0@hotmail.com
Judith	judithlucasmendo@gmail.com
Judith Morales	jiamer6@hotmail.com
Julen	juco.sa@hotmail.com
julia serna zomeño	pejucrisma@hotmail.com
Juliber	bajulilu@gmail.com
Julio Díaz	jdp.julio@gmail.com
Julio Gómez 	jfontedelo@hotmail.com
Julio Silvera	silverajc@hotmail.com
JulioBasLo	bascon_es@hotmail.com
Kapri19	rodri_brieva88@hotmail.com
Karlos Armendariz	armendarizkarlos@gmail.com
KARMELA 	carmen_medina28@hotmail.com
Kike	enrique@us.es
Kiko Sureda cifre	franciscosureda73@gmail.com
KilosSanosBuenos	aballesmarco58@hotmail.com
Kuki de Huelva y Punta Umbría 	kukidehuelva@gmail.com
La Furgo de Greta	gemma.gomez.llanes@gmail.com
LA KATY	matezva@gmail.com
La Mística 	j580v8@gmail.com
Lacampana	lacampanateam@hotmail.es
Laude Lopez	laude501@hotmail.com
Laureneta22jim	mgmirallesgt@gmail.com
Leeroyvankif	m041861@gmail.com
Leo	venecuncio@gmail.com
Letitz86	letitz86@yahoo.es
Lichi	cmachado82@hotmail.com
Lisardo9	manuel.lisardo@gmail.com
Lorena Fernández Montes	lore-da@hotmail.com
Lorena Sanchez	najhelynoa@gmail.com
LorenaSE	lorenase@hotmail.com
Los Pelotis	pedroecorsini@gmail.com
Loscholos	loscholos8@hotmail.com
Lourdes  	lou_r@hotmail.es
Lourdes Gariburo	rus98@hotmail.es
LoyRob	loidarg@hotmail.com
Lucafe	mariajf69@gmail.com
Luis Candelas	inversionesluiscandelas@gmail.com
Luismi	luminuro@yahoo.es
Luismiralles	luis.miralles@hotmail.es
Lusán 	artelusan@gmail.com
M&S Camper	ramafer80@gmail.com
Maca	maricarmencortazar@hotmail.com
Macora88	macora88@gmail.com
MAMLOR	frosky1470@gmail.com
Manu Guerrero 	ess.manu@gmail.com
Manubv	manubv66@hotmail.com
Manuel	manuelbeneditocalvo@gmail.com
Manuel Acosta Merino	toite32@hotmail.com
Manuel Arca Pedrido	arcapouso@hotmail.com
Manuel Blazquez Fernandez	manuelblazquezfernandez@gmail.com
Manuel Burgos Martin	mburgosmartin@gmail.com
Manuel Sánchez	transgrumasa@gmail.com
manuele JENKIN	manujenkin@gmail.com
Manuperez	manuperez61@hotmail.es
Mapomapo	mininangel73@gmail.com
Mar	elvalleperdido10@gmail.com
Maralar	alarcia56@gmail.com
Marcelino Figuerola	markseli1965@hotmail.com
marco morelli	marcospirelli0@gmail.com
Marcos	marcosdegarriga@gmail.com
Mari Loli Martínez Ocaña	marilolimao@gmail.com
Mari1988	keka889@hotmail.com
Maria	sintamaria@hotmail.com
Maria  	mariatrinidad.31@hotmail.es
"María  Olivares"	fermay19@gmail.com
Maria De Los Angeles Rodriguez	gelinos66@hotmail.com
Maria del mar Segura melendez	mdmseguramk@gmail.com
María Isabel Garcia Rodríguez	helix-moga@hotmail.com
Maria José 	macollanta@gmail.com
Maria Jose Fuentes Cobos	mariacobos252@gmail.com
Maria Martinez Perez	mariacamartinez68@gmail.com
Mariajosefa	marijamon72@gmail.com
Marian	angelesg278@gmail.com
Mariana Company López	heracompany@hotmail.com
Mariarovi	mariaarovi@hotmail.com
Maribel Rubio	maribelargo@gmail.com
Marieta	mmgpez@gmail.com
MariJose volswaguen	marixula2572@gmail.com
Mariloco	construccionesjuanluca@hotmail.com
"Marimar  Sánchez "	marimarsp68@gmail.com
Mario Carreras	marius61@gmail.com
Marioct	mariochte@gmail.com
Marisol 	marisolcastillozahonero@gmail.com
Marleen Schotte	marleen.schotte@live.be
MarSan	lospepeshome84@gmail.com
Marta Sáez	marta6822@yahoo.com
Masi	tomasa7722@gmail.com
Masty	caragola@hotmail.com
Mataro21	mireia.vilardebo71@gmsil.com
Maverik	pacovila_negri@hotmail.com
May27	maytemg11@hotmail.com
Mayteborg	mayteborg@yahoo.es
Meche	meche@adinet.com.uy
MeKe	paloma.maciasc@gmail.com
Menchu	caryalex@hotmail.es
mgranjao	mcgranjao@gmail.com
Migbeny	migbeny@hotmail.com
Miguel 	miguelromeromartinez7@gmail.com
"Miguel  Castan"	miguel.a.castan@gmail.com
MigueL Smit Ronda	miguelito_16_87@hotmail.es
Miguelhj81	miguelhj81@hotmail.com
Mindua	lidiavilaro@hotmail.com
Miquelet	mgnadeu@hotmail.com
Miriam	miriky1985@gmail.com
mogariza gonzalez	mogarizagonzalez@gmail.com
Moises Gonzalez	moigld11@gmail.com
Molon Labe	72divad@gmail.com
Molon Labe	pisavendre@gmail.com
Mónica 	la_moni_cast@hotmail.com
"Monica  Ruiz"	mokina1313@hotmail.com
Monica Fernández Pérez	monicaperez5053@gmail.com
Montaña Rodriguez	mon2206@hotmail.com
Montse Cabezas	chrisda.mcj@hotmail.com
MONTSE JIMÉNEZ	montseonly@gmail.com
Montserrat Jimenez	yeraygoji@hotmail.com
Moreno 	diegoegallardo2@gmail.com
MSerra	mserraoliver@gmail.com
MURALLA	future2020tv@gmail.com
Musta Afkir	barautotaller@gmail.com
MyA2003	adrianmg76@gmail.com
MYR	lachupillas@hotmail.com
Nacho 	ipfduende@hotmail.com
Nando 79	fer_cha@hotmail.com
Narciso Pardo	spaindud@gmail.com
narciso.pardo@outlook.com	narciso.pardo@outlook.com
Nati Tamame  	ntr2512@hotmail.com
Neron	alberto-bc@hotmail.com
NHN	kimera_n@hotmail.com
Nike68	marivi1968@hotmail.com
Norberto 	lobo181975@gmail.com
Noteyma E-vans	noteymasl@gmail.com
Nubia 	nubiachic@gmail.com
Numa acompañamiento camper	nuwaramillo@gmail.com
nuria perez	nuris37@gmail.com
Olga happy	olgaseijas@hotmail.es
Omaro	omarocardenosa@gmail.com
Oscar Noguera	oscarshatf@gmail.com
Oscar2604	olopezag@gmail.com
Pablo Martin	pablocp82@gmail.com
Pablo Pazos Varela	pablolaudio@hotmail.com
Pablo Tejada	jpablotejada@gmail.com
Paco de Xerez	francisco_sanchez_59@hotmail.com
Pacoazaustre  	pacoazaustrefotos@gmail.com
Paqui	paqui.tarifa1964@gmail.com
Paraor	difarrago@hotmail.com
pascualpalomares	pascualpalomares@yahoo.es
Pastora 	pastora_1965@hotmail.com
Patricia Turrado Arias  	aliso17@hotmail.com
Patricio  	placalle@hotmail.com
Patrick27262726	patrickokeeffe2726@googlemail.com
Pau Fabra	fabra.pau@gmail.com
Pedro Vecino	pavecino@yahoo.es
pelosorus  	david_orus@hotmail.com
Pepa Lopez	mjln51b@gmail.com
pepayovi64	mariajosebeagresa@gmail.com
Pepe Ros Corbi	peperoscorbi@gmail.com
pepe.buendia	jose.buendia.rubio@gmail.com
Pere Domènech Carbó	pompiers00@hotmail.com
Peter Chapman	pedixi@gmail.com
Petri-karo	karoenka666@gmail.com
Pilar  	pilarentrena13@gmail.com
Pilar Dominguez	pilica58@hotmail.com
Pili Setien	mpsetien@hotmail.com
Piluquy	pilarfr1986@gmail.com
Pingota	pingota.parratorres@gmail.com
Piso Las Lanzas	pisolaslanzas@gmail.com
Poti	potisportback@hotmail.com
qgrkzvwirv	melrktul@testform.xyz
Rafa Conde Fernández  	cfrafa4@gmail.com
Rafa Moreno	rafaelmorenomara10@gmail.com
Rafael Martin espinosa	rme75@hotmail.es
Rafaela De Rodrigo Yelmo	rafi13_51@yahoo.es
rafaelyfrancisca@gmail.com	rafaelyfrancisca@gmail.com
Rafalin	rafalin1983@gmail.com
Rakela	rakela.sm.1971@gmail.com
Raul	rmr_23@hotmail.com
Raul Mompart Galobardes	raulmompart@gmail.com
Raul Moya	raulmoyarodriguez1984@gmail.com
Rbk Sanmamed	rbksanmamed@hotmail.com
Rebeca	rebicruz@hotmail.com
Regla Cala paez	regla171982@gmail.com
REGULO ANTONIO ALVARO LUCAS	alvaroregulo@gmail.com
Rey Lobo	placovimur@gmail.com
Ricardo	rhsantamaria@hotmail.com
Ricardo bahillo Bahillo esguevillas	ricarbahillo@gmail.com
Ricardo Hernandez Santamaria	rhsantamaria59@gmail.com
Ricardo Santiago	rscalleros@gmail.com
ricarsal	ricarsal003@gmail.com
Rimor Sailer	carlesomni10@gmail.com
Risario Seglar Cubedo	sari_seglar66@hotmail.com
Rmc	pedalmontes@hotmail.es
RoberMeli	perezosa60@hotmail.com
"Roberto  Carlettini "	carlettiniroberto@gmail.com
"Roberto  Diaz -Hellin "	rdhformas@gmail.com
Roberto Aldao	raldaoceide@gmail.com
Roberto Celis	rocelis63@gmail.com
Robertus25  	parvejil630@gmail.com
Robi	anayrobi@gmail.com
Rochesolar	pedrolg09@gmail.com
Rocio	roycu97@hotmail.com
"Rocio  Jiménez Muñoz"	rociojimenezmunoz@gmail.com
Rocío Cancho Malpartida  	rociocancho@hotmail.com
RodamonB2	pepb2.cat@gmail.com
Ronald	darkman3050@gmail.com
Rosa  	rosadoradodiazpya@gmail.com
Rosa Delia  Santana  	mafalda_tintin_87@hotmail.com
Rosario Torres Sanchez	rotorsan@gmail.com
Rous	rosabelmiralles@yahoo.es
rriosga	rriosga@yahoo.es
Rubén R. Lope	erubenrlope@gmail.com
Salva	salvadorlopezmaestre2@gmail.com
Sanasu	giradas-exurbios95@icloud.com
Santi	santialvarino@gmail.com
Sara	sirureta001@gmail.com
Sconey	heltomwed@gmail.com
Sebas	sebeneroso@gmail.com
SergioTM	sergiotm_23@hotmail.com
Seteymar	jmlara1@gmail.com
Siri Mantra	abrm79@gmail.com
Sole Martinez	sole20975@gmail.com
Soledad  	soldfont@hotmail.com
Sonia Folgar	jocasoni@gmail.com
Sonia Martínez Carmona	sonaita89@gmail.com
Sonia Rozada	srozadag@gmail.com
Sonia Rozada	vibrapisos@gmail.com
Susa	dolors-1429@hotmail.com
susana anguiano	susimail74@gmail.com
Susi	mjmorenonavarro@gmail.com
Tata Marti	osozarpas@gmail.com
Tati	uryespa@hotmail.com
Techitos	arroyolmpintores@yahoo.es
Tere Romero	teroca@hotmail.es
Teresa	teresamg@hotmail.es
Teresa Estevez Rodriguez	tereyuxia@gmail.com
Thais De Dalmases  	thaisibz@gmail.com
Thomas	tkulus@web.de
Toni	toniambrosino@hotmail.com
Touch	magdalenaferrol@gmail.com
Toveivonne	toniperezgonzalez8@gmail.com
Trini	morleta-pipe.3.33@hotmail.com
Trinidad Pagan	trinidadpagan55@gmail.com
Trudi	laurakdelpozo@gmail.com
Turbonegro	ratlookmusic@gmail.com
Txema Urrutia	hipo47tesis@outlook.com
txemi	txemi2791@gmail.com
V13	vaneviro@yahoo.es
Vane_LL	vanesalostres@hotmail.com
Verico	gretel_bola@yahoo.com
Vero	veroyaritz@icloud.com
Verónica  	kinitoyverito@outlook.es
Versosuelto	m.e.cima@hotmail.com
Vicente	juanvicente3006@hotmail.com
Vicente González	vicentegm59@gmail.com
Vicente Hernández Díaz	vicentilloh@hotmail.com
Victor	victorpaa@hotmail.es
Víctor López de Vinuesa Peláez	cocuvl80@gmail.com
Víctor Lorenzo Días perez Diaz Perez	victorlorenzodiazperez@gmail.com
Victor Manuel Ruiz Garcia	victordeguardamar@gmail.com
Víctor Minguell García	victorminguell@gmail.com
Vidal Jerez	lvidalferrer@gmail.com
vigile	vigile04@gmail.com
VillaCamper	salvamespike@hotmail.com
Violeta Santos Toribio	viosantos2013@gmail.com
Vir	virgin.molina.p@gmail.com
"Virginia  Asensio Pedreño"	lastresedades@gmail.com
Virginia Picon	vir-picon@hotmail.com
Vsabeli	victormanuel.sabel@gmail.com
Wacawuaca	anibalr355@gmail.com
Weinsberg850	helenatdm@hotmail.com
Wesley Leon De Martin Rodriguez	wesley_leon@hotmail.com
Whiskers  	jockabilly@hotmail.com
Xabier Tenaguillo	xabiertenaguillo@gmail.com
Xavymont	montxavy@gmail.com
Xisco Aguiló	esjoncaret@hotmail.es
Xoanxo	xoanxiro@gmail.com
Xuanin	rodriguezjuan973@gmail.com
Yaviyavi71	xavierroiger@gmail.com
Yess	jesussp@yahoo.com.br
Yosi	yosiscu@yahoo.es
ZA Web	zasolucionesweb@gmail.com
Zeferreira10	zeferreira10@gmail.com
Zugas	inizugasti@gmail.com`

    oldUsers = parseOldUsersList(oldUsersText)
  }

  if (!oldUsers || oldUsers.length === 0) {
    console.error('❌ ERROR: No se pudieron cargar los usuarios antiguos')
    process.exit(1)
  }

  console.log(`✅ Usuarios antiguos cargados: ${oldUsers.length}`)

  // Crear un Set de emails antiguos para búsqueda rápida
  const oldEmailsSet = new Set(oldUsers.map(u => u.email.toLowerCase().trim()))

  // Crear cliente con Service Role
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  try {
    console.log('\n🔍 Obteniendo usuarios actuales de Supabase (con paginación)...\n')

    // Obtener TODOS los usuarios actuales con paginación
    let allCurrentUsers = []
    let page = 1
    let perPage = 1000 // Máximo por página
    let hasMore = true

    while (hasMore) {
      const { data, error } = await supabase.auth.admin.listUsers({
        page,
        perPage
      })

      if (error) {
        console.error('❌ ERROR obteniendo usuarios:', error.message)
        process.exit(1)
      }

      allCurrentUsers = allCurrentUsers.concat(data.users)
      console.log(`   📄 Página ${page}: ${data.users.length} usuarios`)

      // Si recibimos menos usuarios que perPage, no hay más páginas
      hasMore = data.users.length === perPage
      page++
    }

    const currentUsers = allCurrentUsers
    console.log(`\n   ✅ Total usuarios actuales: ${currentUsers.length}\n`)

    // Comparar y encontrar nuevos usuarios
    const newUsers = currentUsers.filter(user => {
      const email = (user.email || '').toLowerCase().trim()
      return email && !oldEmailsSet.has(email)
    })

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📊 RESULTADOS DE LA COMPARACIÓN:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    console.log(`   📋 Usuarios antiguos: ${oldUsers.length}`)
    console.log(`   👥 Usuarios actuales: ${currentUsers.length}`)
    console.log(`   🆕 NUEVOS USUARIOS: ${newUsers.length}\n`)

    if (newUsers.length > 0) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('🆕 LISTA DE NUEVOS USUARIOS:')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

      newUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email}`)
        console.log(`   ID: ${user.id}`)
        console.log(`   Registrado: ${new Date(user.created_at).toLocaleDateString('es-ES')} ${new Date(user.created_at).toLocaleTimeString('es-ES')}`)
        console.log(`   Confirmado: ${user.confirmed_at ? '✅ Sí' : '❌ No'}`)
        console.log(`   Admin: ${user.user_metadata?.is_admin ? '👑 Sí' : '👤 No'}`)
        console.log(`   Último acceso: ${user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('es-ES') : '❌ Nunca'}`)
        console.log()
      })

      // Guardar resultados en archivo JSON
      const outputFile = path.join(__dirname, '..', 'usuarios-nuevos.json')
      const outputData = {
        fecha_comparacion: new Date().toISOString(),
        total_usuarios_antiguos: oldUsers.length,
        total_usuarios_actuales: currentUsers.length,
        total_nuevos: newUsers.length,
        nuevos_usuarios: newUsers.map(u => ({
          id: u.id,
          email: u.email,
          created_at: u.created_at,
          confirmed_at: u.confirmed_at,
          last_sign_in_at: u.last_sign_in_at,
          is_admin: u.user_metadata?.is_admin || false,
          user_metadata: u.user_metadata || {}
        }))
      }

      fs.writeFileSync(outputFile, JSON.stringify(outputData, null, 2), 'utf-8')
      console.log(`\n💾 Resultados JSON guardados en: ${outputFile}`)

      // Guardar resultados en archivo Excel
      const excelFile = path.join(__dirname, '..', 'usuarios-nuevos.xlsx')

      // Preparar datos para Excel
      const datosExcel = newUsers.map(user => {
        // Extraer nombre de user_metadata o usar email como nombre si no hay
        const nombreOriginal = user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim() ||
          user.email.split('@')[0] // Usar parte antes del @ si no hay nombre

        // Normalizar nombre (quitar tildes y caracteres especiales)
        const nombreNormalizado = normalizarNombre(nombreOriginal)

        return {
          Nombre: nombreNormalizado,
          Email: user.email
        }
      })

      // Crear libro de Excel
      const workbook = XLSX.utils.book_new()
      const worksheet = XLSX.utils.json_to_sheet(datosExcel)

      // Ajustar ancho de columnas
      worksheet['!cols'] = [
        { wch: 40 }, // Columna Nombre
        { wch: 35 }  // Columna Email
      ]

      // Agregar hoja al libro
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Usuarios Nuevos')

      // Escribir archivo Excel
      XLSX.writeFile(workbook, excelFile)
      console.log(`💾 Resultados Excel guardados en: ${excelFile}\n`)
    } else {
      console.log('✅ No hay nuevos usuarios. Todos los usuarios actuales ya estaban en la lista antigua.\n')
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ COMPARACIÓN COMPLETADA')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  } catch (error) {
    console.error('❌ ERROR INESPERADO:', error.message)
    console.error(error)
    process.exit(1)
  }
}

// Ejecutar script
compareUsers()
