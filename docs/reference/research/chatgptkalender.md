# 1. Tithi-systeem  
- **Regel (gewone taal):** Een *tithi* is de tijd waarin de hoekafstand tussen maan en zon met 12° toeneemt【88†L152-L157】. Het gemiddelde duurt ≈23u37 (variërend ~20–26 uur)【88†L163-L167】. Een tithi kan op elk moment beginnen en eindigen (dus ook midden op de kalenderdag)【88†L163-L167】. De *tithi bij zonsopgang* geldt als de tithi van die dag【96†L1-L5】 (“Udaya tithi”-regel). Als een tithi vóór zonsopgang begint en ook vóór de volgende zonsopgang eindigt, is die **kṣaya tithi** (wordt “overgeslagen” op geen enkele dag)【96†L1-L5】. Als een tithi bij de zonsopgang aanwezig is en nog steeds aanwezig bij de volgende zonsopgang, heet dat een **adhika/vriddhi tithi** (de tithi beslaat twee dagen)【96†L7-L10】.  
- **Beslislogica (pseudocode):**  
  ``` 
  IF tithi aanwezig op de dag bij zonsopgang:
      dag_tithi = die tithi
  ELSE IF tithi begint ná zonsopgang maar vóór volgende zonsopgang:
      dag_tithi = volgende tithi (deze dag begint niet met de tithi)
  ```  
  Dit komt neer op: *de tithi die aanwezig is bij zonsopgang is de tithi van de dag*【96†L1-L5】.  
- **Randgevallen:** Kṣaya-tithi’s komen nauwelijks voor, maar als een tithi volledig tussen twee zonsopgangen valt, valt een typische observantiedag weg voor dat tithi (er is geen dag die deze tithi ‘heeft’). Vriddhi-tithi’s (maandagen) leiden ertoe dat dezelfde tithi op twee dagen geldt – normaal observeert men dan op de eerste dag (volgens sunrise-regel) tenzij een speciale regel (bv. nachtviering) anders voorschrijft. Bij implementatie moet je dus controleren of een festivalstithi bij zonsopgang aanwezig is; als niet, schuif de observatie naar de dag waarop de tithi wel bij zonsopgang valt.  

# 2. Paksha en tithi-namen  
- **Regel (gewone taal):** De maand is in twee paksha’s verdeeld: **Shukla Paksha** (toenemende maan, tithi 1–15, eindigend in Purnima) en **Krishna Paksha** (afnemende maan, tithi 1–15, eindigend in Amavasya)【90†L955-L963】. De namen van de tithi’s zijn klassiek Sanskrit: Pratipada (1), Dvitiya (2), Tritiya (3), …, Chaturdashi (14), gevolgd door Purnima (15e van Shukla) of Amavasya (15e van Krishna)【90†L955-L963】. Drik Panchang gebruikt standaard deze namen met de voorvoegsels “Shukla” of “Krishna” om het paksha aan te duiden (bijv. “Shukla Pratipada”)【90†L955-L963】.  
- **Beslislogica (pseudocode):**  
  - Als *(maanfasenhoek tussen 0° en 180°)* ⇒ Shukla Paksha, naam volgens bovenstaande lijst.  
  - Als *(maanfasenhoek tussen 180° en 360°)* ⇒ Krishna Paksha, naam van dezelfde lijst maar eindigend in Amavasya.  
- **Randgevallen:** De lijst van tithi-namen is vast, maar in regiotructuren kan de toewijzing van een datum aan een maand afwijken (zie Amanta vs Purnimanta hieronder). Drikpanchang toont beide systemen, maar standaard valt een lokatie in Noord-India vaak in het Purnimanta-systeem【27†L163-L172】, in Zuid-India in Amanta【27†L163-L172】. Voor de naamgeving zelf verandert er weinig (men wijst alleen een andere naam toe aan de overlappendingang van de maand).  

# 3. Regels voor tijdstip van observantie (per tithi)  
- **Pradosh Kaal (Chaturthi/Trayodashi):** Pradosh Kaal is de periode vanaf zonsondergang tot ca. 2 uur 24 min erna (6 ghatī)【39†L37-L45】. De fasten/puja van Pradosh wordt gedaan op de dag **waarop Trayodashi in Pradosh Kaal valt**【41†L638-L642】. Concreet: als op de dag van zonsondergang Tīthi = Trayodashi, dan is het Pradosh-vraat op die dag. Als Trayodashi pas ná zonsondergang begint, dan valt de vrijgelezen periode wél in de volgende dag (Dvādaśī), waardoor sommige bronnen het pradosh-vast die dag (Dvādaśī) als uitzonderingsgeval noteren【41†L647-L653】.  
  - **Pseudocode:**  
    ``` 
    IF (Trayodashi_tithi aanwezig in periode [zonsondergang..zonsondergang+2h24]):
        observatie_dag = vandaag
    ELSE IF (Trayodashi begint ná zonsondergang):
        observatie_dag = gisteren (Dwadashi)
    ELSE:
        geen Pradosh-vast deze maand
    ```  
  - **Randgevallen:** Omdat de periode afhankelijk is van lokale zonsondergang, kunnen twee steden de Pradosh-dag verschillen. Als Trayodashi zeer kort is of twee dagen beslaat, moet je controleren: voor observatie telt gewoonlijk of *op enig moment in Pradosh Kaal* Trayodashi aanwezig is【41†L638-L642】. Als Trayodashi vóór zonsondergang eindigt en er dus geen overlap is, vervalt soms het Pradosh-festijn in die maand.  

- **Nishita Kaal (Shivaratri/Ashtami):** *Nishita Kaal* betekent het middagen tijdstip (ritueel midden van nacht). Volgens Drikpanchang is het ~2 ghaṭī (48 min) rond het lokale middernachtstip【97†L181-L184】. Shivaratri (maandelijkse Chaturdashi) moet zó vallen dat dit Nishita Kaal binnen de Chaturdashi-tithi ligt. In andere woorden: de nacht van de viering behoort geheel tot de juiste Chaturdashi【97†L181-L184】. Praktisch: bepaal het moment van local midnight (bijv. 2 Ghati venster) en kijk in welke tithi dat valt. Zo niet, dan schuift de Maas-shivaratri doorgaans naar de volgende of vorige maand (afhankelijk van de traditie).  
  - **Pseudocode:**  
    ``` 
    bepaal_Nishita = (midnight ± 24 min)
    IF Nishita valt in Chaturdashi_tithi:
        observatie_dag = dag waarop Nishita valt
    ELSE:
        (nishita-tithi niet geschikt – speciale regels, meestal skip of verplaats)
    ```  
  - **Randgevallen:** In schrikkelmaanden (adhik), wordt een extra “Adhika Shivaratri” opgenomen (zie adhik-maas). Als de Chaturdashi tithi ontbreekt (kṣaya), vervalt deze maand het Shivaratri. Als de Chaturdashi tithi twee dagen duurt (vriddhi), wordt meestal één van die dagen gekozen (gewone sunrise-regel, tenzij Ratri-vieringen eisen dat het hele nacht-tijdvak ertoe doet). Voor Maha Shivaratri verschuift de maand soms tussen het Amanta- en Purnimanta-systeem (bv. Amanta noemt het “Magha”, Purnimanta “Phalguna”【97†L169-L174】).  

- **Rātri Vyāpini (nacht-spanning, Ashtami/Chaturthi):** Sommige nachtelijke vasten (bv. Kalabhairava Ashtami, Ganesh Chaturthi) vereisen dat de tithi de nacht overspant. Rātri Vyāpini betekent letterlijk “overspanning van de nacht”: de  tithi moet duren zónder vóór zonsopgang voorbij te zijn. Bijvoorbeeld **Kala Bhairava Ashtami**: de Ashtami-tithi moet voorbijgaan op zonsopgang én ook doorgaan námiddernacht【61†L447-L455】. In zo’n geval wordt de Ashtami van die nacht gevolgd als vastdag.  
  - **Pseudocode:**  
    ``` 
    IF (Ashtami_begin < zonsondergang en Ashtami_eind > zonsopgang_volgende):
        observatie_dag = dag met deze Ratri-vyapini Ashtami
    ELSE:
        geen “Ratri-vyapini Ashtami” – andere regels hanteren
    ```  
  - **Randgevallen:** Als een Ashtami niet helemaal de nacht dekt (bijv. eindigt vóór middernacht), zijn sommige regels hieromheen ambigu. In praktijk hanteert men doorgaans dat voor nachtelijke vieringen het “Ratri-vyapini” tithi gekozen moet worden【61†L447-L455】. Een korte tithi die niet de nacht overspant, geeft dus geen geldige nachtelijke Ashtami voor dat feest.

- **Aparāhṇa (middag/namiddag):** *Aparāhṇa* betekent “middag/namiddag” (ongeveer 3–6 uur ’s middags)【69†L247-L255】. Dit is vooral relevant als muhurta: bijvoorbeeld wordt Ekadashi-parana (de verbreking van Ekadashi) traditioneel gedaan in de Aparāhṇa-muhūrta van Dvādasi, en rituele tilak op Bhai Dooj en Yama Dwitiya vaak in de namiddag. Het is geen dag-bepalende regel maar een tijdvak binnen de dag.  
  - **Pseudocode:** niet van toepassing voor datumbepaling (maar wel voor muhurta-keuze).  
  - **Randgevallen:** Zorg dat in de berekening je de Aparāhṇa-tijd correct in kaart brengt (ongeveer 3 Ghati na middag (ruwweg 15:00–18:00 lokale tijd)【69†L247-L255】). Eventuele ceremonie-momenten vallen binnen deze periode.

- **Algemene regel bij tithi-overlap:** In alle gevallen geldt primair de **zonsopgangregel**: een festival wordt gehouden op de kalenderdag *waarop bij zonsopgang de betreffende tithi geldt*【96†L1-L5】, tenzij bovengenoemde uitzonderingen (Pradosh, Nishita, Ratri-vyapini) aangeven dat een ander criterium gebruikt moet worden. Kortom: standaard “de tithi bij zon opgang = festivaltithi” (Udaya Tithi Regel) met speciale aanpassingen voor nacht- of avondvieringen.  

# 4. Regels voor specifieke gebeurtenissen  
- **Māsik en Mahā Shivaratri:** Shivaratri valt steeds op Krishna Paksha Chaturdashi. Voor Māsik Shivaratri geldt het Nishita-regel: het midden van de nacht (Nishita Kaal) moet in die Chaturdashi liggen【97†L181-L184】. In schrikkelmaanden komt een *Adhika Shivaratri* voor (een extra maandelijkse Shivaratri)【97†L169-L174】. Als een Chaturdashi Kṣaya is (ontbreekt), vervalt de Shivaratri van die maand. Bij Vriddhi-Chaturdashi (2 dagen) kan men meestal de eerste nemen (volgens Sunrise-regel) mits deze de nacht beslaat; zo niet, verplaatst men soms naar de tweede dag als nacht-voorwaarden voorkomen.  
  - **Pseudocode:**  
    ``` 
    IF (Chaturdashi_present AND Nishita in Chaturdashi):
        observe Shivaratri op die dag
    ELSE:
        (geen Shivaratri deze maand of verplaatsing noodzakelijk)
    ```  
  - **Randgevallen:** In de Amanta/Purnimanta-systemen kan de maandnaam voor Maha Shivaratri verschillen【97†L169-L174】. Voor zeldzame ádhik- of kṣaya-situaties volgen verschillende tradities aanvullende afspraken (bijv. Mahashivaratri kan verschuiven naar volgende jaar of volgens regiocustom worden ingevuld).  

- **Saṅkaṣṭi Chaturthi:** Dit is de Chaturthi ná Purnima in Krishna Paksha (waning moon) gewijd aan Ganesh. Belangrijk is de **maanopkomst**: de Ganesh-vasten wordt alleen doorgehouden tot het moment waarop de maan opkomt tijdens de Chaturthi-tithi. Concreet: het vasten (vrijbreken) vindt plaats zodra de maan opkomt **tijdens de Chaturthi van Krishna Paksha**【65†L441-L449】. Als de maan pas opkomt nadat de Chaturthi is afgelopen, is die dag eigenlijk niet bruikbaar. In dat geval verschuift het observatiemoment naar de voorafgaande kalenderdag (Tritiya)【65†L441-L449】.  
  - **Pseudocode:**  
    ``` 
    IF (maanopkomst gebeurt terwijl Chaturthi_tithi nog loopt):
        observe Sankashti op die Chaturthi
    ELSE:
        observe Sankashti op de voorafgaande kalenderdag (Tritiya)
    ```  
  - **Randgevallen:** Omdat maansopkomst tijd lokaal verschilt, kunnen verschillend berekende Panchanga’s afwijken. DrikPanchang benadrukt daarom dat men locatiegebonden moet rekenen【65†L441-L449】. Sommige bronnen negeren dit voor gemak en publiceren één lijst (wat kan afwijken in andere plaatsen).  

- **Ekādaśī:** Ekādaśī-vasten zit vol systematiek. **Smarta-regel:** Ekādaśī moet bij de lokale zonsopgang aanwezig zijn; anders schuif je naar volgende dag. **Vaiṣṇava-regel:** Ekādaśī moet vóór arunoḍaya (ongeveer 96 min voor zonsopgang) zijn begonnen, om “onvervuild” te zijn door Āśu (Dvādasi)【77†L139-L147】. Praktisch: voor Vaishnavas betekent dit strictere criteria (beiden fast tot volgende dag, geen vervroeging). Als een Ekādaśī-tithi in een adhika-maas valt, spreekt men van een *Gauna Ekādaśī*. In dat geval observeert men doorgaans **niet** op die Gauna-Ekādaśī maar pas op de volgende (Nija) Ekādaśī in de volgende maand【84†L1-L4】. Ook kan Āramba Ekādaśī en Mahan Dvādaśī voorkomen als bijzondere gevallen (bv. wanneer door kalenderverkapping twee Ekādaśī’s samenvallen). In de praktijk adviseert DrikPanchang bij twee opeenvolgende Ekādaśī-dagen om de eerste (“Gauna”) te negeren en op de tweede (“Nija”) te vasten【84†L1-L4】.  
  - **Pseudocode:**  
    ``` 
    IF (EK11_present_at_sunrise):
        if (traditie=Smārta) observe on dateA
        if (traditie=Vaiṣṇava AND (Dashami_ended_96min_before_sunrise)) observe on dateA
        ELSE observe on dateB (Vishnu-akalp of naaste volgende dag)
    IF (adhik_month AND first Ekadashi):
        label as Gauna (skip), use second as Nija
    ```  
  - **Randgevallen:** Verschillende *sampradāya’s* handelen Ekādaśī’s anders: ISKCON/Vaiṣṇava volgt de Vaishnavaregel van “Niet-gelijkende Dashami”【77†L139-L147】. *Mahā Dvādaśī* doet zich voor als extra Dvādaśī-vasten naast Ekādaśī (rond Sankashti of Iskcon’s Nirjala bijv.). Als Āramba Ekādaśī en Kṣaya Ekādaśī optreden (tithi ontbreekt of dubbel), hanteert men eigen (techische) regels die hier te ver voeren om uit te werken.  

- **Kāl Bhairava Āṣṭamī (Kāla-Āṣṭamī):** Ook dit is een nachtelijk ritueel (nachtelijke puja voor Shiva/Bhairava). Net als bij Rātri-vyāpini geldt: de Āṣṭamī-tithi moet de nacht overspannen. Concreet kiest men de Āṣṭamī waarbij de middernacht valt (Rātri-vyāpini Āṣṭamī)【61†L447-L455】. Heeft een andere Āṣṭamī nachtelijke status (b.v. kortere variant), dan vervalt die.  
  - **Pseudocode:**  
    ``` 
    IF (Ashtami_start < vorige_middernacht AND Ashtami_end > volgende_zonsopgang):
        observe KalaBhairava_Ashtami op die nacht
    ELSE:
        (geen nachtelijke Ashtami voor dit ritueel)
    ```  
  - **Randgevallen:** Als bijvoorbeeld door een Kṣaya of Vriddhi een nachtelijke Āṣṭamī ontbreekt of dubbel voorkomt, worden traditioneel de hierboven genoemde “Rātri-vyāpini” voorkeurregels gevolgd【61†L447-L455】.  

- **Pūrṇimā en Amāvasyā (inkl. Darśa Āmāvasya):** Algemeen: elke 15e tithi Shukla = Pūrṇimā (volle maan), elke 15e Krishna = Amāvasyā (nieuwe maan). *Darśa Āmāvasya* is simpelweg elke nieuwe maan en wordt gezien als krachtig voor voorouders en Chandra-wijding【80†L129-L138】. Traditioneel is Darśa Amāvasyā (KR Paksha Amavasya) een tarpaṇ-vastdag. Regionaal zijn er variaties: in Bhadrapada (ashwin) bijv. “Pitru Āmāvasya” voor Shraddhā, in Kerala “Kārttika Māha-Āmāvasya” (Kārttika Amavasya) voor visva­rātrikātara. Pūrṇimā-feesten (bv. Guru Pūrṇimā, Kārttika Pūrṇimā) volgen Shukla 15, die veelal gelijk blijven over regioverschillen. Wel beïnvloedt Amanta/Purnimanta de maandnaam: een Amāvasyā kan in Purnimanta bijv. “Bhadrapada” genoemd worden, terwijl in Amanta-systemen dat de volgende maand kan zijn【97†L169-L174】.  
  - **Pseudocode:**  
    ``` 
    # Geen complexe logica; Purnima/Amavasya zijn vaste tithi-dagen.
    ```  
  - **Randgevallen:** Belangrijke Amāvasyā’s en Pūrṇimā’s staan vast (bijv. “Mahalaya” of “Pitru Paksha Amavasya” in Noord-India). Regionaal bestaan verschillen in benaming (bv. “Sugrivashtami” of “Darśa” voor dezelfde datum). In sommige tradities wordt Darśa Āmāvasya alleen in bepaalde maanden gevierd; dit staat niet standaard in DrikPanchang maar in lokale kalenders.  

# 5. Adhika Māsa (schrikkelmaand)  
- **Regel (gewone taal):** Een *Adhika Māsa* ontstaat als twee opeenvolgende nieuwe manen vallen **zonder** dat de zon van zodiakteken verandert tussen die newmoons【82†L125-L128】. M.a.w. als een lunistische maand geen zonsverplaatsing (saṃkrānti) omvat, wordt het een “extra” maand. De naam van die maand is dan een duplicaat van de voorafgaande maand, voorafgegaan door “Adhika” (bijv. “Adhika Jyeshtha”). Dit corrigeert de ~11 dagen achterstand van de maankalender【82†L125-L128】.  
  - **Pseudocode:**  
    ``` 
    IF (geen zon-zodiakwisseling tussen 2 opeenvolgende newmoons):
        maand = Adhika + naam_van_maand
    ```  
- **Observaties (wat wel/geen feesten):** Over het algemeen **vervallen** de meeste vaste feesten in een adhik-maand en worden ze *in de volgende (nija)* maand gevierd. Belangrijk voorbeeld: *Ekādaśī* in een adhik-maas heet *Gauna Ekādaśī* en wordt géén vast gehouden (men vast pas bij de volgende ekādaśī)【84†L1-L4】. Ook huwelijken en bepaalde muhurta-ceremonies vinden meestal geen doorgang in adhik-maas (als “inhuwelijksmaand” beschouwd). Alleen uitzondering: sommige special fasten worden wel in de adhik-maas gedaan (zie lokale tradities).  
- **Gauna- vs Nija-maand:** Dit concept bepaalt of een festival in de “extra” (gauna) of “echte” maand valt. De vuistregel: **Nija-maand:** de “eigenlijke” maand (na de adhik-maas), daar viert men het feest. **Gauna-maand:** de adhik-maand zelf. DrikPanchang geeft bij ekādaśī’s aan dat als twee data verschijnen (adhik en nija), de **eerste** (gauna, adhik) primair is – maar dit is juist het omgekeerde van sommige traditionele gebruiken. In de praktijk wordt de eerste datum vaak als *Gauna Ekādashi* beschouwd en overgeslagen【84†L1-L4】, zodat men dus op de tweede (nija) daadwerkelijk vast. Voor andere vrata worden verschillen zelden expliciet gemeld in Drik; men kan aanhouden dat *alle* vrata als Nija gelden (dus adhik-versie wordt niet gevierd).  
- **Randgevallen:** Als een maand wordt verdubbeld, hernoemt Drik deze als “Adhika X”. Sommige regionale kalenders (bijv. Oriya, Nepali) hebben eigen namen voor deze periodes. Bij sommige festivals (bv. Durga Navratri) in een adhik-maand kan het gebeuren dat de (vaishnava/smarta) boekhouding van datum verspringt. In de code moet je dus detecteren of een maand adhik is (via zon- en maanstanden) en vervolgens bekende verboden zoals ‘geen Ekadashi vasten’ erop toepassen.  

# 6. Māsa’s (maanmaanden)  
- **Regel (gewone taal):** De twaalf normale maanmaanden heten: Chaitra, Vaiśākha, Jyeṣṭha, Āṣāḍha, Śrāvaṇa, Bhādrapada, Āśvina, Kārtika, Agrahāyaṇa (Margashirsha), Pauṣa, Māgha, Phālguna【92†L127-L135】. Deze volgen elkaar op vanaf de nieuwe maan in maart/april (Chaitra) tot de nieuwe maan in februari/maart (Phālguna). DrikPanchang toont deze namen in zowel Amanta- als Purnimanta-variant voor dezelfde dag (bijv. Purnimanta “Jyeshtha Adhika” en Amanta “Jyeshtha Adhika” zoals het voorbeeld voor mei 2026【25†L5-L12】). In de praktijk hangt het systeem af van regio: Noord-India (Purnimanta) gebruikt maand-einde bij Volle Maan, Zuid (Amanta) bij Nieuwe Maan【27†L163-L172】.  
  - **Beslislogica (pseudocode):**  
    ``` 
    #Bepaal maandgrens met zonsnadering: 
    IF (zon gaat teken Y naar Y+1) binnen huidige tithi:
        sluit huidige maand af. 
    Maandnaam = naam_van_maand_behalve_als_adhik
    ```  
  - **Randgevallen:** De keuze Amanta/Purnimanta beïnvloedt in welke maand een tithi valt. Bijvoorbeeld Maha Shivaratri 2026 valt in Purnimanta-periode “Margashirsha”, maar in Amanta zou het bij “Kartika” gerekend worden【97†L169-L174】. DrikPanchang laat gebruikers bij instellingen de preferentie kiezen; de data zelf (voor tithi-bepaling) blijven onveranderd. Voor mij als ontwikkelaar is het vooral belangrijk welk schoolsysteem je als uitgangspunt neemt – Drik default richt zich vaak op Purnimanta (noordelijke) traditie【27†L163-L172】.  

# 7. Nakṣatra, Yoga en Kāraṇa  
- **Praktische uitleg:** *Nakṣatra’s* (28 maanzevens), *Yoga’s* en *Kāraṇa’s* zijn de andere drie Panchāṅga-componenten. Ze zijn gebaseerd op respectievelijk de sterposities van de maan, de somhoeken van zon+maan, en de halve tithi’s (6°-stappen). Deze worden vooral gebruikt om gunstige muhurta’s binnen een tithi te bepalen (bijv. wanneer godsdienstige rituelen precies te beginnen). De meeste festivals zijn **primair tithi-gebaseerd**, en nakṣatra/yoga/karana spelen nauwelijks een rol bij de dagkeuze.  
  - **Voorbeeldgebruik:** Een enkele uitzondering is dat in sommige tradities (vooral onder Vaishṇava’s) Krishna Janmāṣṭamī wordt geassocieerd met de Rohiṇī-nakṣatra op de achtste dag【77†L139-L147】. Maar het officiële *datumcriterium* voor Janmāṣṭamī is Asṭamī (Krishna Pakṣa in Bhādrapada), niet nakṣatra. Er zijn zeldzame “nakṣatra-vrata’s” (bv. Pūrvabhādrapadā Vrata) die vallen bij een bepaald sterrenbeeld, maar die staan niet centraal in de Drik-bronnen. Yoga of kāraṇa komen nauwelijks voor als aparte datumregelingen; ze kunnen hooguit aangeven welk pre-sunrise-moment (Yoga) geschikt is om een puja te voltooien.  
  - **Randgevallen:** In de geraadpleegde bronnen (DrikPanchang, śāstra’s) vond ik geen voorbeelden van feesten die *uitsluitend* op basis van nakṣatra of yoga worden vastgesteld. Bij gebrek aan duidelijke shastrische instructie baseert een implementatie zich dus vooral op tithi-regels. Als er regionale of traditiespecifieke nakṣatraverrschuivingen bestaan, staan die meestal vermeld in lokale kalenders, niet in algemene Panchanga-richtlijnen.

**Bronvermelding:** Deze regels zijn gebaseerd op klassieke en modern-gebruikte panchāṅga-adviezen en praktische kalenders zoals DrikPanchang【88†L152-L157】【96†L1-L5】【41†L638-L642】【65†L441-L449】【77†L139-L147】【84†L1-L4】【61†L447-L455】【80†L129-L138】【82†L125-L128】【27†L163-L172】. Alle getallen en termen komen overeen met de conventies van DrikPanchang, zodat de implementatie hiermee in lijn blijft. Regionalekalenders kunnen soms afwijken (met name Amanta/Purnimanta-schema), maar die verschillen zijn hierboven genoteerd.
