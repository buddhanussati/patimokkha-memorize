
// Flag to satisfy the check in lookupWordHandler
window.paliDictionary = true;
var isLookupEnabled = false;
// Thêm biến Timer để quản lý độ trễ cho sự kiện mouseenter
var lookupTimer = null; 
// Mặc định: Độ trễ 100ms
const LOOKUP_DELAY_MS = 100; 

function togglePaliLookup() {
    isLookupEnabled = !isLookupEnabled;
    const btn = document.getElementById('btn-dictionary');
    
    // --- SAVE TO LOCAL STORAGE ---
    localStorage.setItem('dictionaryEnabled', isLookupEnabled);

    if (isLookupEnabled) {
        btn.style.backgroundColor = "#d35400"; // Active color (Orange)
        enablePaliLookup();
    } else {
        btn.style.backgroundColor = ""; // Default color
        disablePaliLookup();
    }
}

function enablePaliLookup() {
    // 1. Add visual indicator
    $('.word').addClass('lookup-active');
    
    // 2. Gỡ bỏ các event handler cũ
    $(document).off('mouseenter', '.word'); 
    $(document).off('mouseleave', '.word'); 

    // MOUSEENTER: Thiết lập độ trễ (delay)
    $(document).on('mouseenter', '.word', function() {
        var $word = $(this);
        // Xóa bất kỳ timer nào đang chạy từ các từ khác
        if (lookupTimer) {
            clearTimeout(lookupTimer);
        }
        
        // Thiết lập timer mới
        lookupTimer = setTimeout(function() {
            // Chỉ hiển thị popup nếu con trỏ vẫn còn trên từ
            if ($word.is(':hover')) {
                // Dùng .call() để đảm bảo 'this' trong lookupWordHandler là phần tử DOM hiện tại
                lookupWordHandler.call($word[0]); 
            }
            lookupTimer = null; // Reset timer sau khi chạy
        }, LOOKUP_DELAY_MS); 
    });
    
    // MOUSELEAVE: Xóa timer và tắt popup ngay lập tức
    $(document).on('mouseleave', '.word', function() {
        // 1. Xóa timer hiện popup đang chờ (nếu có)
        if (lookupTimer) {
            clearTimeout(lookupTimer);
            lookupTimer = null;
        }
        
        // 2. Xóa popup đang hiển thị (nếu có)
        $(this).find('span.meaning').remove();
    });
}

function disablePaliLookup() {
    // Đảm bảo xóa timer nếu nó đang chạy khi tắt tính năng
    if (lookupTimer) {
        clearTimeout(lookupTimer);
        lookupTimer = null;
    }
    $('.word').removeClass('lookup-active');
    $(document).off('mouseenter', '.word');
    $(document).off('mouseleave', '.word');
    $('.meaning').remove();
}

function lookupWordHandler(event) {
    if (!window.paliDictionary) return;
    if ($(this).children().is("span.meaning")) return;

    const $wordElement = $(this);
    const rawElementText = this.innerText || $(this).text();
    const isRecitationActive = document.body.classList.contains('recitation-active-mode');

    // --- HELPER: Dictionary Rendering Logic ---
    function showDictionary() {
        var word = rawElementText.toLowerCase().trim();

        // CRITICAL FIX: Remove punctuation from edges
        word = word.replace(/^[“‘"(\[]+|[”’"),‚.\]?!:–;]+$/g, '');

        // Standard replacements
        word = word.replace(/­/g, ''); 
        word = word.replace(/ṁg/g, 'ṅg')
                   .replace(/ṁk/g, 'ṅk')
                   .replace(/ṁ/g, 'ṁ'); 

        // Perform Lookup
        var meaning = lookupWord(word, rawElementText); 
        
        if (meaning) {
            var dictBox = $('<span class="meaning">' + meaning + '</span>');
            
            // Prevent bubbling on the dictionary box too
            dictBox.on('click touchstart', function(e) {
                e.stopPropagation();
            });

            $wordElement.append(dictBox);
            
            // Prevent popup from going off-screen (Right edge detection)
            var offset = $wordElement.offset();
            var width = 300; // approx max width
            if (offset.left + width > $(window).width()) {
                 dictBox.css({left: 'auto', right: 0});
            }
        }
    }

    // --- RECITATION MODE: Rhythm Box Logic ---
    if (isRecitationActive) {
        const cleanText = rawElementText.toLowerCase().replace(/[.,:;!?'"“”‘’()\[\]{}...–-]/g, '').trim();

        // 1. FIND WORD POSITION (Index in the sentence/line)
        const wordIndex = $wordElement.parent().find('.word').index(this);

        // 2. DEFINE THEME-SPECIFIC COLORS
        const isDarkMode = document.body.getAttribute('data-theme') === 'dark';
        const lightModeColors = [
            '#c0392b', '#2980b9', '#27ae60', '#8e44ad', '#d35400', 
            '#2c3e50', '#16a085', '#b53471', '#5758bb', '#1b1464',
            '#006266', '#6F1E51', '#1289A7', '#D980FA', '#0652DD',
            '#c23616', '#192a56', '#2f3640', '#44bd32', '#833471'
        ];
        const darkModeColors = [
            '#ff7675', '#74b9ff', '#55e6c1', '#a29bfe', '#fab1a0',
            '#18dcff', '#7d5fff', '#ffaf40', '#32ff7e', '#ff3838',
            '#ffeaa7', '#81ecec', '#fdcb6e', '#fd79a8', '#55efc4',
            '#00d2d3', '#00cec9', '#fab1a0', '#ff9f43', '#fffa65',
        ];

        const colorPalette = isDarkMode ? darkModeColors : lightModeColors;
        const wordColor = colorPalette[wordIndex % colorPalette.length];

        // 3. ACCURATE PALI RHYTHM ANALYSIS
        const longVowels = ['ā', 'ī', 'ū', 'e', 'o'];
        const vowels = 'aāiīuūeo';
        const aspirates = ['kh', 'gh', 'ch', 'jh', 'ṭh', 'ḍh', 'th', 'dh', 'ph', 'bh'];
        
        let rhythm = [];
        for (let i = 0; i < cleanText.length; i++) {
            let char = cleanText[i];
            if (vowels.includes(char)) {
                let isGuru = false;
                if (longVowels.includes(char)) {
                    isGuru = true;
                } else {
                    let nextPart = cleanText.slice(i + 1);
                    if (nextPart.startsWith('ṁ')) {
                        isGuru = true;
                    } else {
                        let following = nextPart.match(/^([^aāiīuūeo]+)/);
                        if (following) {
                            let cluster = following[0];
                            let tempCluster = cluster;
                            aspirates.forEach(a => { tempCluster = tempCluster.replace(a, 'K'); });
                            if (tempCluster.length > 1) isGuru = true;
                        }
                    }
                }
                rhythm.push(isGuru ? 'fa-minus' : 'fa-circle');
            }
        }

        // 4. RENDER RHYTHM BOX
        let symbolsHtml = rhythm.map(icon => {
            const size = (icon === 'fa-minus') ? '18px' : '10px';
            return `<i class="fas ${icon}" style="font-size: ${size}; margin: 0 4px; text-shadow: 1px 1px 1px rgba(0,0,0,0.1);"></i>`;
        }).join('');

        // Added 'cursor: pointer' so it's obviously clickable
        const textBox = $(`
            <span class="meaning rhythm-box" style="min-width: 60px; padding: 12px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer;">
                <div style="color: ${wordColor}; display: flex; align-items: center; justify-content: center; gap: 2px;">
                    ${symbolsHtml}
                </div>
                <div style="font-size: 10px; margin-top: 4px; opacity: 0.6; color: inherit;">Tap to look up</div>
            </span>
        `);
        
        // --- CLICK EVENT: Switch to Dictionary ---
        textBox.on('click touchstart', function(e) {
            e.stopPropagation(); // Stop event bubbling on mobile
            if (e.type === 'touchstart') e.preventDefault(); // Stop double-firing from emulated clicks
            
            $(this).remove(); // Hide the rhythm box
            showDictionary(); // Fire the dictionary meaning script
        });

        $wordElement.append(textBox);
        
        var offset = $wordElement.offset();
        if (offset.left + textBox.outerWidth() > $(window).width()) {
             textBox.css({left: 'auto', right: 0});
        }
        return; 
    }

    // --- NORMAL MODE: Direct Dictionary Lookup ---
    showDictionary();
}

/* --- LOOKUP LOGIC (Exact copy of logic from pali-lookup-standalone.js) --- */
function lookupWord(word, displayTitle) {
    // Safety check for data
    if (typeof dpd_i2h === 'undefined') {
        console.warn("Pali Data (dpd_i2h) not loaded!");
        return "<i>Dictionary data not found.<br>Please check console.</i>";
    }

    let out = "";
    
    // Logic from original: replace quotes and normalize 'ṁ' to 'ṃ' for dictionary keys
    const originalWord = word;
    var lookupKey = word.replace(/[’”'"]/g, "").replace(/ṁ/g, "ṃ");

    // 1. Dictionary Lookup (dpd_i2h)
    if (lookupKey in dpd_i2h) {
        out += `<strong>${originalWord}</strong>`;
        out += `<ul style="line-height: 1.4em; padding-left: 15px; margin-top: 4px; list-style: disc inside;">`;
        
        for (const headword of dpd_i2h[lookupKey]) {
            if (headword in dpd_ebts) {
                // Formatting logic from original script
                const match = headword.match(/^(.+?)\s(\d[\d.]*)$/);
                let formattedHeadword;
                if (match) {
                    const wordPart = match[1].trim();
                    const numberPart = match[2];
                    formattedHeadword = `${wordPart}<sub style="font-size:60%; font-weight:bold;">${numberPart}</sub>`;
                } else {
                    formattedHeadword = headword;
                }
                out += `<li><b>${formattedHeadword}</b>: ${dpd_ebts[headword]}</li>`;
            }
        }
        out += "</ul>";
    }

    // 2. Deconstructor Lookup (dpd_deconstructor)
    if (typeof dpd_deconstructor !== 'undefined' && lookupKey in dpd_deconstructor) {
        if(out === "") out += `<strong>${originalWord}</strong><br>`; // Header if not already added
        out += `<div style="margin-top:8px; border-top:1px solid #555; padding-top:4px;">
                <small style="color:#aaa"></small>
                ${dpd_deconstructor[lookupKey]}
                </div>`;
    }

    return out === "" ? null : out.replace(/ṁ/g, "ṃ");
}

    /* --- INFO CONTENT DATA --- */
const introContent = `
         <h4>INTRODUCTION</h4>
        <p><i><b>“Uggaṇhātha, bhikkhave, āṭānāṭiyaṃ rakkhaṃ. Pariyāpuṇātha, bhikkhave, āṭānāṭiyaṃ rakkhaṃ. Dhāretha, bhikkhave, āṭānāṭiyaṃ rakkhaṃ. Atthasaṃhitā, bhikkhave, āṭānāṭiyā rakkhā bhikkhūnaṃ bhikkhunīnaṃ upāsakānaṃ upāsikānaṃ guttiyā rakkhāya avihiṃsāya phāsuvihārāyā”ti.</b></i> (Dīgha Nikāya 32).</p>
        
        <p><i>“Monks, learn the Āṭānāṭiya protection, study the Āṭānāṭiya protection, hold in your hearts the Āṭānāṭiya protection. Monks, beneficial is the Āṭānāṭiya protection for security, protection, freedom from harm and living in ease for monks, nuns (bhikkhunis) and male and female lay followers”.</i></p>
        
        <p>With these words the Buddha exhorted His monks to learn the Āṭānāṭiya protection for their protection and thus began the tradition of chanting the Sutta (discourses) for protection and good results. The Sutta chanted for protection, etc., is also known as ‘Paritta’ which means “the Sutta that protects those who chant and who listen to it against dangers, calamities, etc., from all around.” Through the ages other Suttas were added to the list of ‘Suttas for chanting’. Thus we find in Milindapañha and the Commentaries by the Venerable Buddhaghosa the following nine Suttas mentioned as Parittas: <b>Ratanasutta, Mettāsutta, Khandhasutta, Morasutta, Dhajaggasutta, Āṭānāṭiyasutta, Aṅgulimālasutta, Bojhaṅgasutta</b> and <b>Isigilisutta</b>.</p>
        
        <p>The collection presented here includes the first eight Suttas and in addition, Maṅgalasutta, Vaṭṭasutta and Pubbaṇhasutta, thus comprising altogether 11 Suttas, with further addition of introductory verses at the beginning of each Sutta. These are the 11 Suttas chanted everyday in every monastery and nunnery and in some houses of lay people in all Theravāda Buddhist countries. This collection is known in Myanmar as ‘The Great Paritta’, not because the Suttas in this collection are long ones, but probably because they have great power, if chanted and listened to in a correct way, could ward off dangers and bring in results.</p>
        
        <h4>CHANTING OF AND LISTENING TO THE SUTTAS</h4>
        <p>Since these Parittas are meant for protection and other good results, it is important that they are chanted and listened to in a correct way. There are some conditions to he fulfilled by both the chanters and the listeners so as to get the full benefits of the Paritta. In fact, there are three conditions for the chanters to fulfill and another three for the listeners:</p>
        
        <b>The three conditions for the chanters are:</b>
        <ol>
            <li>They must have learnt and chant the Suttas correctly and fully without any omission,</li>
            <li>They must understand the meaning of the Suttas being chanted, and</li>
            <li>They must chant with the heart filled with goodwill and loving-kindness.</li>
        </ol>
        
        <b>The three conditions for the listeners are:</b>
        <ol>
            <li>They must not have committed the five most heinous crimes, namely, killing one’s own father, killing one’s own mother, killing an Arahant, causing the blood to be congealed in the body of the Buddha by wounding Him, and causing schism in the Saṅgha.</li>
            <li>They must not have the ‘fixed wrong view’, the view that rejects kamma and its results.</li>
            <li>They must listen to the chanting with confidence in the efficacy of the Suttas in warding off the dangers and bringing good results. (When people listen with confidence they do so with respect and attention, so listening with respect and attention is implied in this condition.)</li>
        </ol>
        
        <p>Only when these conditions are fulfilled do people get full benefits from the Parittas. Therefore, it is important that when the Parittas are being chanted, people should listen to the chanting with confidence, respect and attentiveness. Moreover, the chanting of Parittas for benefits is a two way action. Those who chant are like those who give out something, and those who listen are like those who take what is given; if they do not take what is given they will not get the thing. In the same way if people do not listen to the chanting, but just let other people chant and themselves do something else, they surely are not taking what is given and so they will not get the benefits of the chanting.</p>
        
        <h4>REFERENCES</h4>
        <p>Except the introductory verses, the Suttas are found in the Piṭakas as follows:<br>
        <small>(Reference numbers are page numbers of Sixth Buddhist Council Edition except those of Jātakas which are given by Jātaka numbers).</small></p>
        
        <ul>
            <li><b>Preliminary</b> => composed by compilers.</li>
            <li><b>1. Maṅgalasutta</b> => Khuddakapāṭha, 3-4; Suttanipāta, 308-9.</li>
            
            <li><b>2. Ratatasutta</b><br>
            introductory passage => Dhammapada Aṭṭhakathā,ii. 272,<br>
            following two verses => composed by compilers,<br>
            remaining text => Khuddakapāṭha, 4-7; Suttanipāta, 312-5.</li>
            
            <li><b>3. Mettāsutta</b> => Khuddakapāṭha, 10-12; Suttanipāta, 300-1.</li>
            <li><b>4. Khandhasutta</b> => Vinaya. iv. 245; Aṅguttaranikāya, i. 384; Jātaka no. 203.</li>
            <li><b>5. Morasutta</b> => Jātaka no. 159.</li>
            <li><b>6. Vaṭṭasutta</b> => Cariyapiṭaka, 415.</li>
            <li><b>7. Dhajaggasutta</b> => Saṃyuttanikāya, i. 220-2.</li>
            
            <li><b>8. Āṭānāṭiyasutta</b><br>
            verses 104-109 => Dīghanikāya, iii. 159.<br>
            verses 102, 103, 110-130 => composed by compilers.<br>
            verse 131 => Dhammapada, verse 109.</li>
            
            <li><b>9. Aṅgulimālasutta</b> => Majjhimanikāya, ii. 306.</li>
            
            <li><b>10. Bojjhaṅgasutta</b><br>
            original Suttas => Saṃyuttanikāya, iii. 71, 72, 73.<br>
            Verses here => composed by compilers.</li>
            
            <li><b>11. Pubbaṇhasutta</b><br>
            verse 153 => Khuddakapāṭha, 5; Suttanipāta, 312.<br>
            verses 162-4 => Aṅguttaranikāya, i. 299.<br>
            the rest => composed by compilers.</li>
        </ul>

        <h4>THE USE OF THE PARITTAS</h4>
        <p>Although the Parittas are for chanting in general, some of the Parittas are to be practiced as well. Only the Ratanasutta, Morasutta, Vaṭṭasutta, Āṭānāṭiyasutta, Aṅgulimālasutta and Pubbaṇhasutta are meant for chanting only; the others are for both chanting and practicing. And there are specific uses for the Parittas although generally they are meant for protection against dangers. The specific uses can be obtained from the introductory verses of each Sutta. They are, in brief, as follows:</p>
        
        <ul style="list-style-type: none; padding-left: 0;">
            <li><b>1. Maṅgalasutta</b> => for blessings and prosperity,</li>
            <li><b>2. Ratatasutta</b> => for getting free from dangers caused by disease, evil spirits and famine,</li>
            <li><b>3. Mettāsutta</b> => for suffusing all kinds of beings with loving-kindness,</li>
            <li><b>4. Khandhasutta</b> => for protecting against snakes and other creatures,</li>
            <li><b>5. Morasutta</b> => for protection against snares, imprisonment and for safety,</li>
            <li><b>6. Vaṭṭasutta</b> => for protection against fire,</li>
            <li><b>7. Dhajaggasutta</b> => for protection against fear, trembling and horror,</li>
            <li><b>8. Āṭānāṭiyasutta</b> => for protection against evil spirits, and gaining health and happiness,</li>
            <li><b>9. Aṅgulimālasutta</b> => for easy delivery for expectant mothers,</li>
            <li><b>10. Bojjhaṅgasutta</b> => for protection against and getting free from sickness and disease,</li>
            <li><b>11. Pubbaṇhasutta</b> => for protection against bad omens, etc., and gaining happiness.</li>
        </ul>
        
       <h4>LOVING-KINDNESS</h4>
        <p>Never before has the need for loving-kindness been so much felt as in these days. Violence is rampant throughout the world. If we cannot and do not reduce violence, the world will be a living hell for all inhabitants. Therefore it is imperative that we do something to at least reduce violence even if we will not be able to wipe it out from the world altogether. The practice of loving-kindness fortunately for us can help us achieve that aim; we can help reduce violence with the practice of loving-kindness and make things better for all beings.</p>
        
        <h4>SHARING MERITS</h4>
        <p>‘Sharing Merits’ is always a pleasant act to do whenever we do meritorious deeds. When Parittas are chanted in sonorous tones and listened to with devotional faith, the immediate benefits they bring are serenity, calm, peacefulness and joy. Generations have enjoyed these benefits and many others of Paritta and Mettā for many many years. These benefits are for us too if we chant, listen to and practice them in a correct way. May all beings enjoy the benefits of Paritta and Mettā following the instructions given here.</p>
        
        <p><i>U Sīlānanda, Aggamahāpaṇḍita<br>USA, 1998</i></p>
    `;

const sectionInfoData = {
    'Paritta': introContent,
    'MS': introContent,
    'Ratana': introContent,
    'Metta': introContent,
    'Khandha': introContent,
    'Mora': introContent,
    'Vaṭṭa': introContent,
    'Dhajagga': introContent,
    'Āṭānāṭiya': introContent,
    'Aṅgulimāla': introContent,
    'Bojjhaṅga': introContent,
    'Pubbaṇha': introContent
};
    const sections = [
      {
    id: 'Paritta', title: 'Paritta Parikamma', title_vn: 'Introductory Verses', audio: '00-ParittaPalikamma.mp3',
    text: `Namo tassa Bhagavato Arahato Sammāsambuddhassa. [12.437]
Homage to Him, the Blessed One, the Worthy One, the Fully Enlightened One.
Namo tassa Bhagavato Arahato Sammāsambuddhassa. [7.939]
Homage to Him, the Blessed One, the Worthy One, the Fully Enlightened One.
Namo tassa Bhagavato Arahato Sammāsambuddhassa. [8.598]
Homage to Him, the Blessed One, the Worthy One, the Fully Enlightened One.

Samantā cakkavāḷesu, atrāgacchantu devatā, [7.882]
From throughout the entire universe, may the Devas (celestial beings) come here,
Saddhammaṃ Munirājassa, suṇantu saggamokkhadaṃ: [7.479]
And listen to the Sublime Dhamma of the Sage King, which leads to heavenly bliss and liberation.
Dhammassavanakālo ayaṃ bhadantā! [5.732]
O Noble Ones, now is the time to listen to the Dhamma!
Dhammassavanakālo ayaṃ bhadantā! [4.725]
O Noble Ones, now is the time to listen to the Dhamma!
Dhammassavanakālo ayaṃ bhadantā! [5.419]
O Noble Ones, now is the time to listen to the Dhamma!

Namo tassa Bhagavato Arahato Sammāsambuddhassa. [6.986]
Homage to Him, the Blessed One, the Worthy One, the Fully Enlightened One.
Namo tassa Bhagavato Arahato Sammāsambuddhassa. [7.434]
Homage to Him, the Blessed One, the Worthy One, the Fully Enlightened One.
Namo tassa Bhagavato Arahato Sammāsambuddhassa. [7.815]
Homage to Him, the Blessed One, the Worthy One, the Fully Enlightened One.

Ye santā santacittā, tisaraṇasaraṇā, ettha lokantare vā, [9.673]
Those peaceful ones with tranquil minds, who have taken refuge in the Triple Gem, whether in this world or other worlds,
Bhummā bhummā ca devā, guṇagaṇagahaṇa byāvaṭā sabbakālaṃ, [9.472]
And the terrestrial or celestial Devas, who are always engaged in accumulating a multitude of merits.
Ete āyantu devā, varakanakamaye, Merurāje vasanto, [8.867]
May those peaceful Devas come here, who dwell on the noble golden Mount Meru, the king of mountains.
Santo santo sahetuṃ, Munivaravacanaṃ, sotumaggaṃ samaggā. [9.942]
Let us all together listen to the precious words of the Great Sage (Muni), which are the supreme source of peace.

Sabbesu cakkavāḷesu, yakkhā devā ca brahmano, [7.255]
From all the universes, may the Yakkhas, Devas, and Brahmas,
Yaṃ amhehi kataṃ puññaṃ, sabbasampattisādhakaṃ, [6.605]
Rejoice in whatever merit has been performed by us, which brings about all achievements.
Sabbe taṃ anumoditvā, samaggā sāsane ratā, [6.852]
May you all rejoice in that merit, being united and devoted to the Sasana (Dispensation),
Pamādarahitā hontu, ārakkhāsu visesato. [7.210]
And provide protection without negligence.

Sāsanassa ca lokassa, vuḍḍhī bhavatu sabbadā, [6.382]
May there always be prosperity for the Sasana and for the world.
Sāsanampi ca lokañca, devā rakkhantu sabbadā. [7.568]
May the Devas always protect the world and the Sasana.
Saddhiṃ hontu sukhī sabbe, parivārehi attano, [6.986]
May all beings, along with their retinues and relatives, be happy and well,
Anīghā sumanā hontu, saha sabbehi ñātibhi. [7.367]
And may they be free from all suffering and distress.

Rājato vā, corato vā, manussato vā, amanussato vā, [8.934]
From dangers of kings, thieves, humans, and non-humans,
Aggito vā, udakato vā, pisācato vā, khāṇukato vā, [8.554]
From fire, water, ghosts, and fallen trees,
Kaṇṭakato vā, nakkhattato vā, janapadarogato vā, asaddhammato vā, [9.516]
From thorns, unlucky stars, epidemics, and false teachings,
Asandiṭṭhito vā, asappurisato vā, [5.777]
From wrong views and evil persons,
Caṇḍa hatthī assa miga goṇa kukkura ahivicchikā maṇisappa dīpi [10.524]
From wild elephants, horses, deer, bulls, dogs, snakes, scorpions, vipers, and leopards,
Accha taraccha sūkara mahiṃsa yakkha rakkhasādīhi, [7.120]
From bears, hyenas, wild boars, buffaloes, spirits, and demons,
Nānā bhayato vā, nānā rogato vā, [5.105]
May you protect all beings from various dangers and diseases,
Nānā upaddavato vā, ārakkhaṃ gaṇhantu. [8.8]
And from all forms of fear and adversity.`
},

{
    id: 'MS', title: '1. Maṅgalasutta ', title_vn: '1. The Blessings Discourse', audio: '01-Mangalasutta.mp3',
    text: `Yaṃ maṅgalaṃ dvādasahi, cintayiṃsu sadevakā; [9.582]
For twelve years, deities and humans pondered on what constitutes a blessing,
Sotthānaṃ nādhigacchanti, aṭṭhattiṃsañca maṅgalaṃ. [7.411]
Yet they failed to reach an understanding of the thirty-eight blessings.
Desitaṃ devadevena, sabbapāpavināsanaṃ; [6.680]
The blessing taught by the God of gods (the Buddha), which destroys all evil,
Sabbalokahitatthāya, maṅgalaṃ taṃ bhaṇāma he. [7.494]
For the welfare of the whole world—O Noble Ones, let us recite that blessing.

Evaṃ me sutaṃ - ekaṃ samayaṃ bhagavā sāvatthiyaṃ viharati [8.914]
Thus have I heard: At one time, the Blessed One was staying near Sāvatthī,
Jetavane anāthapiṇḍikassa ārāme. [5.858]
In Jeta’s Grove, in the monastery of Anāthapiṇḍika.
Atha kho aññatarā devatā abhikkantāya rattiyā abhikkantavaṇṇā [9.725]
Then, a certain deity, as the night was fading, of surpassing radiance,
Kevalakappaṃ jetavanaṃ obhāsetvā yena bhagavā tenupasaṅkami; [10.539]
Illuminating the entire Jeta’s Grove, approached the Blessed One;
Upasaṅkamitvā bhagavantaṃ abhivādetvā ekamantaṃ aṭṭhāsi. [8.684]
Having approached and paid homage to the Blessed One, he stood to one side.
Ekamantaṃ ṭhitā kho sā devatā bhagavantaṃ gāthāya ajjhabhāsi: [11.690]
Standing there, the deity addressed the Blessed One in verse:

“Bahū devā manussā ca, maṅgalāni acintayuṃ; [6.701]
"Many deities and humans have pondered on blessings;
Ākaṅkhamānā sotthānaṃ, brūhi maṅgalamuttamaṃ”. [7.035]
Longing for safety and well-being, please tell us the Supreme Blessing."

Asevanā ca bālānaṃ, paṇḍitānañca sevanā; [6.471]
Not associating with fools, associating with the wise,
Pūjā ca pūjaneyyānaṃ‚ etaṃ maṅgalamuttamaṃ. [7.077]
And honoring those worthy of honor—this is the Supreme Blessing.

Patirūpadesavāso ca, pubbe ca katapuññatā; [7.056]
Living in a suitable locality, having made merit in the past,
Attasammāpaṇidhi ca, etaṃ maṅgalamuttamaṃ. [6.576]
And directing oneself rightly—this is the Supreme Blessing.

Bāhusaccañca sippañca, vinayo ca susikkhito; [6.722]
Great learning, skill in crafts, and well-mastered discipline,
Subhāsitā ca yā vācā, etaṃ maṅgalamuttamaṃ. [7.578]
And well-spoken speech—this is the Supreme Blessing.

Mātāpitu upaṭṭhānaṃ, puttadārassa saṅgaho; [7.494]
Support for mother and father, cherishing wife and children,
Anākulā ca kammantā, etaṃ maṅgalamuttamaṃ. [7.265]
And peaceful, unconfused occupations—this is the Supreme Blessing.

Dānañca dhammacariyā ca, ñātakānañca saṅgaho; [7.494]
Generosity, living by the Dhamma, and support for relatives,
Anavajjāni kammāni, etaṃ maṅgalamuttamaṃ. [7.327]
And blameless actions—this is the Supreme Blessing.

Aratī viratī pāpā, majjapānā ca saṃyamo; [7.766]
Ceasing and refraining from evil, restraint from intoxicants,
Appamādo ca dhammesu, etaṃ maṅgalamuttamaṃ. [7.285]
And heedfulness in the Dhamma—this is the Supreme Blessing.

Gāravo ca nivāto ca, santuṭṭhi ca kataññutā; [7.327]
Respect, humility, contentment, and gratitude,
Kālena dhammassavanaṃ‚ etaṃ maṅgalamuttamaṃ. [6.868]
Hearing the Dhamma at the right time—this is the Supreme Blessing.

Khantī ca sovacassatā, samaṇānañca dassanaṃ; [6.743]
Patience, being easy to speak to, seeing the contemplatives,
Kālena dhammasākacchā, etaṃ maṅgalamuttamaṃ. [7.452]
And discussing the Dhamma at the right time—this is the Supreme Blessing.

Tapo ca brahmacariyañca, ariyasaccāna dassanaṃ; [7.118]
Self-restraint, the holy life, and seeing the Noble Truths,
Nibbānasacchikiriyā ca, etaṃ maṅgalamuttamaṃ. [7.536]
And the realization of Nibbāna—this is the Supreme Blessing.

Phuṭṭhassa lokadhammehi, cittaṃ yassa na kampati; [7.014]
Though touched by the ways of the world, the mind that does not waver,
Asokaṃ virajaṃ khemaṃ, etaṃ maṅgalamuttamaṃ. [8.308]
Sorrowless, stainless, and secure—this is the Supreme Blessing.

Etādisāni katvāna, sabbatthamaparājitā; [7.953]
Having fulfilled these things, they are undefeated everywhere;
Sabbattha sotthiṃ gacchanti, taṃ tesaṃ maṅgalamuttamaṃ. [9.781]
Everywhere they go in safety—that is their Supreme Blessing.`
},

{
    id: 'Ratana', title: '2. Ratanasutta', title_vn: '2. The Treasures Discourse', audio: '02-Ratanasutta.mp3',
    text: `Paṇidhānato paṭṭhāya tathāgatassa dasa pāramiyo, [10.128]
From the time of His initial aspiration, the Tathāgata's ten perfections,
Dasa upapāramiyo, dasa paramatthapāramiyoti, samatiṃsa pāramiyo, [10.446]
The ten higher perfections, and the ten ultimate perfections—the thirty perfections in total,
Pañca mahapariccāge, lokatthacariyaṃ ñātatthacariyaṃ buddhatthacariyanti tisso cariyāyo [12.642]
The five great sacrifices, and the three modes of conduct: for the welfare of the world, for the welfare of His kin, and for the attainment of Buddhahood,
Pacchimabhave gabbhavokkantiṃ jātiṃ abhinikkhamanaṃ padhānacariyaṃ bodhipallaṅke māravijayaṃ [14.082]
His final descent into the womb, His birth, the Great Renunciation, His supreme exertion, and His victory over Mara at the foot of the Bodhi tree,
Sabbaññutaññāṇappativedhaṃ dhammacakkappavattanaṃ navalokuttaradhammeti [10.983]
His penetration of Omniscient Knowledge, the Turning of the Wheel of Dhamma, and the nine supramundane states;
Sabbepime buddhaguṇe āvajjetvā vesāliyā tīsu pākarantaresu [10.275]
Reflecting upon all these Buddha-qualities within the three walls of the city of Vesālī,
Tiyāmarattiṃ parittaṃ karonto āyasmā ānandatthero viya kāruññacittaṃ upaṭṭhapetvā [12.325]
The Venerable Ānanda Thera, having established a mind of boundless compassion, recited this protection through the three watches of the night.
Koṭīsahassesu, cakkavāḷesu devatā; [6.150]
The deities in a thousand billion universes,
Yassānaṃ paṭiggaṇhanti, yañca vesāliyā pure. [7.297]
Accepted this protection which was recited in the city of Vesālī.
Rogāmanussadubbhikkha sambhutaṃ tividhaṃ bhayaṃ; [6.931]
The threefold fear arising from disease, non-human beings, and famine,
Khippamantaradhāpesi, parittaṃ taṃ bhaṇāma he. [7.297]
Was quickly vanished. O Noble Ones, let us now recite that protection!

Yānīdha bhūtāni samāgatāni, bhummāni‚ vā yāni va antalikkhe. [9.494]
Whatever beings are assembled here, whether of the earth or in the air,
Sabbeva bhūtā sumanā bhavantu, athopi sakkacca suṇantu bhāsitaṃ. [9.518]
May all these beings be happy of heart, and let them listen closely to these words.
Tasmā hi bhūtā nisāmetha sabbe, mettaṃ karotha mānusiyā pajāya; [9.103]
Therefore, O beings, pay attention all of you: extend goodwill to the human race;
Divā ca ratto ca haranti ye baliṃ, tasmā hi ne rakkhatha appamattā. [9.347]
Who, day and night, bring you offerings; therefore, protect them diligently.

Yaṃ kiñci vittaṃ idha vā huraṃ vā, saggesu vā yaṃ ratanaṃ paṇītaṃ; [10.202]
Whatever wealth there be, here or beyond, or whatever precious jewel in the heavens,
Na no samaṃ atthi tathāgatena, idampi buddhe ratanaṃ paṇītaṃ; etena saccena suvatthi hotu. [14.180]
There is none equal to the Tathāgata. In the Buddha is this precious jewel found. By this truth, may there be well-being!

Khayaṃ virāgaṃ amataṃ paṇītaṃ, yadajjhagā sakyamunī samāhito; [9.884]
The destruction (of craving), detachment, and the deathless supreme, which the Sakyan Sage attained in concentrated mind;
Na tena dhammena samatthi kiñci, idampi dhamme ratanaṃ paṇītaṃ; etena saccena suvatthi hotu. [14.570]
There is nothing equal to that Dhamma. In the Dhamma is this precious jewel found. By this truth, may there be well-being!

Yaṃ buddhaseṭṭho parivaṇṇayī suciṃ, samādhimānantarikaññamāhu; [9.103]
The pure concentration which the Supreme Buddha praised, which is called "immediate" in its result;
Samādhinā tena samo na vijjati, idampi dhamme ratanaṃ paṇītaṃ; etena saccena suvatthi hotu. [14.277]
There is no concentration equal to that. In the Dhamma is this precious jewel found. By this truth, may there be well-being!

Ye puggalā aṭṭha sataṃ pasatthā, cattāri etāni yugāni honti; [9.250]
The eight individuals praised by the virtuous, they constitute four pairs;
Te dakkhiṇeyyā sugatassa sāvakā, etesu dinnāni mahapphalāni; [8.981]
These disciples of the One Well-Gone are worthy of offerings; gifts given to them yield great fruit.
Idampi saṅghe ratanaṃ paṇītaṃ, etena saccena suvatthi hotu. [9.811]
In the Sangha is this precious jewel found. By this truth, may there be well-being!

Ye suppayuttā manasā daḷhena, nikkāmino gotamasāsanamhi; [9.128]
Those who are well-applied with a firm mind, free from desire in Gotama’s dispensation;
Te pattipattā amataṃ vigayha, laddhā mudhā nibbutiṃ bhuñjamānā. [10.202]
They have attained the goal, plunged into the deathless, and enjoy the peace they have gained for free.
Idampi saṅghe ratanaṃ paṇītaṃ, etena saccena suvatthi hotu. [9.689]
In the Sangha is this precious jewel found. By this truth, may there be well-being!

Yathindakhīlo pathavissito siyā, catubbhi vātehi asampakampiyo. [9.713]
Just as a city pillar (indakhīlo) firmly planted in the earth is not shaken by the four winds;
Tathūpamaṃ sappurisaṃ vadāmi, yo ariyasaccāni avecca passati; [8.933]
Even so, I say, is the virtuous person who clearly sees the Noble Truths.
Idampi saṅghe ratanaṃ paṇītaṃ, etena saccena suvatthi hotu. [10.006]
In the Sangha is this precious jewel found. By this truth, may there be well-being!

Ye ariyasaccāni vibhāvayanti, gambhīrapaññena sudesitāni; [8.664]
Those who clearly comprehend the Noble Truths, well-taught by Him of profound wisdom;
Kiñcāpi te honti bhusaṃ pamattā, na te bhavaṃ aṭṭhamamādiyanti; [9.103]
Even if they be greatly heedless, they will not take an eighth rebirth.
Idampi saṅghe ratanaṃ paṇītaṃ, etena saccena suvatthi hotu. [9.909]
In the Sangha is this precious jewel found. By this truth, may there be well-being!

Sahāvassa dassanasampadāya, tayassu dhammā jahitā bhavanti. [8.371]
With his attainment of vision, three things are abandoned at once:
Sakkāyadiṭṭhī vicikicchitañca, sīlabbataṃ vāpi yadatthi kiñci. [9.006]
Self-identity view, doubt, and whatever attachment to rites and rituals there may be.
Catūhapāyehi ca vippamutto, chaccābhiṭhānāni abhabba kātuṃ. [8.884]
He is also free from the four states of misery and is incapable of committing the six major wrongdoings.
Idampi saṅghe ratanaṃ paṇītaṃ, etena saccena suvatthi hotu. [9.836]
In the Sangha is this precious jewel found. By this truth, may there be well-being!

Kiñcāpi so kamma karoti pāpakaṃ, kāyena vācā uda cetasā vā. [10.177]
Whatever evil action he may perform by body, speech, or mind;
Abhabba so tassa paṭicchadāya, abhabbatā diṭṭhapadassa vuttā. [8.615]
He is incapable of concealing it; such is the incapacity of one who has seen the Path.
Idampi saṅghe ratanaṃ paṇītaṃ, etena saccena suvatthi hotu. [9.225]
In the Sangha is this precious jewel found. By this truth, may there be well-being!

Vanappagumbe yatha phussitagge, gimhānamāse paṭhamasmiṃ gimhe. [9.030]
Like a woodland grove in full bloom in the first month of the summer season;
Tathūpamaṃ dhammavaraṃ adesayi, nibbānagāmiṃ paramaṃ hitāya. [8.396]
So is the sublime Dhamma which He taught, leading to Nibbāna for the highest benefit.
Idampi buddhe ratanaṃ paṇītaṃ, etena saccena suvatthi hotu. [9.421]
In the Buddha is this precious jewel found. By this truth, may there be well-being!

Varo varaññū varado varāharo, anuttaro dhammavaraṃ adesayi; [8.298]
The Excellent One, the Knower of the excellent, the Giver of the excellent, the Bringer of the excellent, the Peerless One, taught the excellent Dhamma.
Idampi buddhe ratanaṃ paṇītaṃ, etena saccena suvatthi hotu. [9.323]
In the Buddha is this precious jewel found. By this truth, may there be well-being!

Khīṇaṃ purāṇaṃ nava natthi sambhavaṃ, virattacittāyatike bhavasmiṃ; [9.713]
The old (karma) is exhausted, there is no new arising, the mind is detached from future existence;
Te khīṇabījā avirūḷhichandā, nibbanti dhīrā yathāyaṃ padīpo. [9.543]
They, with their seeds destroyed and no desire for growth, the wise ones go out even as this lamp.
Idampi saṅghe ratanaṃ paṇītaṃ, etena saccena suvatthi hotu. [9.445]
In the Sangha is this precious jewel found. By this truth, may there be well-being!

Yānīdha bhūtāni samāgatāni, bhummāni vā yāni va antalikkhe; [9.177]
Whatever beings are assembled here, whether of the earth or in the air;
Tathāgataṃ devamanussapūjitaṃ, buddhaṃ namassāma suvatthi hotu. [9.152]
Let us revere the Tathāgata, the Buddha, honored by gods and humans. May there be well-being!

Yānīdha bhūtāni samāgatāni, bhummāni vā yāni va antalikkhe; [9.128]
Whatever beings are assembled here, whether of the earth or in the air;
Tathāgataṃ devamanussapūjitaṃ, dhammaṃ namassāma suvatthi hotu. [8.566]
Let us revere the Tathāgata, the Dhamma, honored by gods and humans. May there be well-being!

Yānīdha bhūtāni samāgatāni, bhummāni vā yāni va antalikkhe; [9.274]
Whatever beings are assembled here, whether of the earth or in the air;
Tathāgataṃ devamanussapūjitaṃ, saṅghaṃ namassāma suvatthi hotu. [10.500]
Let us revere the Tathāgata, the Sangha, honored by gods and humans. May there be well-being!`
},

{
    id: 'Metta', title: '3. Mettasutta', title_vn: '3. The Goodwill Discourse', audio: '03-Mettasutta.mp3',
    text: `Yassānubhāvato yakkhā, nevadassenti bhīsanaṃ; [10.475]
By the power of this protection, the Yakkhas (spirits) do not show frightening sights.
Yamhi cevānuyuñjanto, rattindivamatandito. [7.643]
One who practices this diligently, day and night, without sloth,
Sukhaṃ supati sutto ca, pāpaṃ kiñci na passati; [7.061]
Sleeps happily, and while sleeping, sees no evil dreams.
Evamādi guṇūpetaṃ, parittaṃ taṃ bhaṇāma he. [8.419]
Endowed with such qualities—O Noble Ones, let us recite this protection of Goodwill.

Karaṇīyamatthakusalena, yanta santaṃ padaṃ abhisamecca; [8.186]
This should be done by one skilled in good, who seeks the state of peace (Nibbāna):
Sakko ujū ca suhujū ca, suvaco cassa mudu anatimānī. [8.768]
One should be capable, upright, truly straightforward, easy to speak to, gentle, and not arrogant.
Santussako ca subharo ca, appakicco ca sallahukavutti; [7.565]
Contented, easy to support, with few duties, and living lightly.
Santindriyo ca nipako ca, appagabbho kulesvananugiddho. [8.419]
With senses calmed, prudent, not impudent, and not greedily attached to families.

Na ca khuddamācare kiñci, yena viññū pare upavadeyyuṃ; [8.846]
One should not do even the slightest thing that the wise might censure.
Sukhino va khemino hontu, sabbasattā bhavantu sukhitattā. [8.807]
May all beings be happy and secure; may they be happy at heart.
Ye keci pāṇabhūtatthi, tasā vā thāvarā vanavasesā; [8.419]
Whatever living beings there are—whether weak or strong, without exception,
Dīghā vā yeva mahantā, majjhimā rassakā aṇukathūlā. [8.419]
The long, the large, the medium, the short, the tiny, or the great.

Diṭṭhā vā yeva adiṭṭhā, ye va dūre vasanti avidūre. [8.380]
Those seen or unseen, those dwelling far or near,
Bhūtā va sambhavesī va, sabbasattā bhavantu sukhitattā. [8.264]
Those who are born or those seeking birth—may all beings be happy at heart.
Na paro paraṃ nikubbetha, nātimaññetha katthaci na kiñci‚ [8.264]
Let none deceive another, nor despise anyone anywhere.
Byārosanā paṭighasaññā, nāññamaññassa dukkhamiccheyya. [8.186]
In anger or ill-will, let them not wish harm to one another.

Mātā yathā niyaṃ puttamāyusā ekaputtamanurakkhe; [8.225]
Just as a mother would protect her only child with her life,
Evampi sabbabhūtesu, mānasaṃ bhāvaye aparimāṇaṃ. [8.341]
Even so, toward all beings, let one cultivate a boundless heart.
Mettañca sabbalokasmi, mānasaṃ bhāvaye aparimāṇaṃ; [7.837]
Let one's goodwill for the whole world be boundless,
Uddhaṃ adho ca tiriyañca, asambādhaṃ averamasapattaṃ. [9.040]
Above, below, and across—unobstructed, without enmity or rivalry.

Tiṭṭhaṃ caraṃ nisinno va, sayāno yāvatāssa vitamiddho‚ [8.147]
Whether standing, walking, sitting, or lying down, as long as one is awake,
Etaṃ satiṃ adhiṭṭheyya, brahmametaṃ vihāramidhamāhu. [8.807]
One should sustain this mindfulness; this is called the "Divine Abiding" here.
Diṭṭhiñca anupaggamma, sīlavā dassanena sampanno; [7.682]
Not falling into wrong views, being virtuous and endowed with vision,
Kāmesu vineyya gedhaṃ, na hi jātuggabbhaseyya punareti. [11.709]
Having overcome greed for sensual pleasures, one never again comes to lie in a womb.`
},

{
    id: 'Khandha', title: '4. Khandhasutta', title_vn: '4. The Group Protection Discourse', audio: '04-Khandhasutta.mp3',
    text: `Sabbāsīvisajātīnaṃ, dibbamantāgadaṃ viya; [10.975]
For all kinds of poisonous creatures, like a divine spell or celestial medicine;
Yaṃ nāseti visaṃ ghoraṃ, sesañcāpi parissayaṃ. [7.946]
Which destroys terrible venom and all other dangers.
Aṇākkhettamhi sabbattha, sabbadā sabbapāṇinaṃ; [7.499]
Everywhere within the sphere of authority, for all beings at all times;
Sabbassopi nivāreti, parittaṃ taṃ bhaṇāma he. [7.896]
It wards off every harm. O Noble Ones, let us recite this Khandha protection!

Virūpakkhehi me mettaṃ, mettaṃ erāpathehi me; [7.300]
May I have love for the Virūpakkhas, and love for the Erāpathas;
Chabyāputtehi me mettaṃ, mettaṃ kaṇhāgotamakehi ca. [8.095]
May I have love for the Chabyāputtas, and love for the Kaṇhāgotamakas.

Apādakehi me mettaṃ, mettaṃ dvipādakehi me. [7.002]
May I have love for the footless, and love for those with two feet;
Catuppadehi me mettaṃ, mettaṃ bahuppadehi me. [6.654]
May I have love for the four-footed, and love for those with many feet.

Mā maṃ apādako hiṃsi, mā maṃ hiṃsi dvipādako [7.052]
May the footless ones not harm me, may the two-footed ones not harm me;
Mā maṃ catuppado hiṃsi, mā maṃ hiṃsi bahuppado. [7.548]
May the four-footed ones not harm me, may the many-footed ones not harm me.

Sabbe sattā sabbe pāṇā, sabbe bhūtā ca kevalā; [8.045]
May all beings, all breathing things, all creatures without exception;
Sabbe bhadrāni passantu, mā kañci pāpamāgamā. [7.995]
May they all see what is good, and may no evil come to anyone.

Appamāṇo buddho, appamāṇo dhammo; appamāṇo saṅgho, [8.194]
Immeasurable is the Buddha, immeasurable is the Dhamma, immeasurable is the Sangha;
Pamāṇavantāni sarīsapāni; ahivicchikā satapadī, uṇṇanābhī sarabū mūsikā. [12.316]
Finite are creeping things: snakes, scorpions, centipedes, spiders, lizards, and mice.

Katā me rakkhā katā me parittā paṭikkamantu bhūtāni. [8.492]
I have made this protection, I have made this safeguard; may those beings depart!
Sohaṃ namo bhagavato, namo sattannaṃ sammāsambuddhānaṃ. [10.952]
I pay homage to the Blessed One, homage to the seven Fully Enlightened Buddhas.`
},

{
    id: 'Mora', title: '5. Morasutta', title_vn: '5. The Peacock Discourse', audio: '05-Morasutta.mp3',
    text: `Pūrentaṃ bodhisambhāre, nibbattaṃ morayoniyaṃ; [10.284]
While fulfilling the requisites of Buddhahood, He was born in the womb of a peacock;
Yena saṃvihitārakkhaṃ, mahāsattaṃ vanecarā. [6.639]
By this protection, the Great Being wandering in the forest was guarded.
Cirassaṃ vāyamantāpi, neva sakkhiṃsu gaṇhituṃ; [6.466]
Though they strived for a long time, the hunters were never able to capture Him.
“Brahmamantan”ti akkhātaṃ, parittaṃ taṃ bhaṇāma he. [7.551]
O Noble Ones, let us recite this protection, known as the "Sublime Mantra."

Udetayaṃ cakkhumā ekarājā, harissavaṇṇo pathavippabhāso; [9.048]
There rises the sun, the one with eyes, the sole king, golden-hued, illuminating the earth;
Taṃ taṃ namassāmi harissavaṇṇaṃ pathavippabhāsaṃ, tayājja guttā viharemu divasaṃ. [11.087]
I pay homage to you, the golden-hued who illuminates the earth; guarded by you, may we live safely through this day.
Ye brāhmaṇā vedagū sabbadhamme, te me namo te ca maṃ pālayantu; [9.135]
Those Holy Ones (Brahmins) who have reached the end of all knowledge, my homage to them; may they protect me.
Namatthu buddhānaṃ namatthu bodhiyā, namo vimuttānaṃ namo vimuttiyā; [9.221]
Homage to the Buddhas! Homage to Enlightenment! Homage to the Released! Homage to Liberation!
Imaṃ so parittaṃ katvā, moro carati esanā. [7.572]
Having made this protection, the peacock wanders in search of food.

Apetayaṃ cakkhumā ekarājā, harissavaṇṇo pathavippabhāso; [8.288]
There sets the sun, the one with eyes, the sole king, golden-hued, illuminating the earth;
Taṃ taṃ namassāmi harissavaṇṇaṃ pathavippabhāsaṃ, tayājja guttā viharemu rattiṃ. [10.436]
I pay homage to you, the golden-hued who illuminates the earth; guarded by you, may we live safely through this night.
Ye brāhmaṇā vedagū sabbadhamme, te me namo te ca maṃ pālayantu; [8.787]
Those Holy Ones (Brahmins) who have reached the end of all knowledge, my homage to them; may they protect me.
Namatthu buddhānaṃ namatthu bodhiyā, namo vimuttānaṃ namo vimuttiyā; [9.004]
Homage to the Buddhas! Homage to Enlightenment! Homage to the Released! Homage to Liberation!
Imaṃ so parittaṃ katvā, moro vāsamakappayi. [7.925]
Having made this protection, the peacock settles down for the night.`
},

 
 
{
    id: 'Vaṭṭa', title: '6. Vaṭṭasutta', title_vn: '6. The Quail Discourse', audio: '06-Vattasutta.mp3',
    text: `Pūrentaṃ bodhisambhāre, nibbattaṃ vaṭṭajātiyaṃ; [10.597]
While fulfilling the requisites of Enlightenment, He was born in the species of quails;
Yassa tejena dāvaggi, mahāsattaṃ vivajjayi. [6.696]
Through the power of this (protection), the forest fire avoided the Great Being.
Therassa Sāriputtassa, lokanāthena bhāsitaṃ; [6.172]
Spoken by the Lord of the World to the Elder Sāriputta;
Kappaṭṭhāyiṃ mahātejaṃ, parittaṃ taṃ bhaṇāma he. [7.492]
Endowed with great power that lasts for an aeon—O Noble Ones, let us recite this protection!

Atthi loke sīlaguṇo, saccaṃ soceyyanuddayā; [6.774]
There are in the world the virtues of morality, truth, purity, and compassion;
Tena saccena kāhāmi, saccakiriyamuttamaṃ. [6.327]
By that truth, I shall perform an act of supreme truth.
Avajjetvā dhammabalaṃ, saritvā pubbake jine; [6.289]
Reflecting on the power of the Dhamma and remembering the Victors of the past;
Saccabalamavassāya, saccakiriyamakāsahaṃ. [6.677]
Relying on the power of truth, I performed an act of truth:

Santi pakkhā apatanā, santi pādā avañcanā; [6.735]
"There are wings, yet they cannot fly; there are feet, yet they cannot walk;
Mātāpitā ca nikkhantā, jātaveda paṭikkama." [6.871]
Mother and father have gone out; O Fire, go back!"
Saha sacce kate mayhaṃ, mahāpajjalito sikhī; [6.890]
When I performed this act of truth, the great blazing crest of fire;
Vajjesi soḷasakarīsāni, udakaṃ patvā yathā sikhī; [7.880]
Avoided sixteen lengths of land, as if the fire had met with water.
Saccena me samo natthi, esā me saccapāramī. [7.922]
There is none equal to me in truth; this is my Perfection of Truth.`
},

{
    id: 'Dhajagga', title: '7. Dhajaggasutta', title_vn: '7. The Top-of-banner Discourse', audio: '07-Dhajaggasutta.mp3',
    text: `Yassānussaranenāpi, antalikkhepi pāṇino. [8.263]
By the mere recollection of this protection, even beings in the mid-air
Patiṭṭhamadhigacchanti, bhūmiyaṃ viya sabbathā. [6.225]
Gain a firm footing, just as they would on the earth in every way.
Sabbupaddavajālamhā, yakkhacorādisambhavā; [6.442]
From the net of all calamities, arising from Yakkhas, thieves, and countless others,
Gaṇanā na ca muttānaṃ, parittaṃ taṃ bhaṇāma he. [8.308]
Those who are released are beyond counting; O Noble Ones, let us recite this protection.

Evaṃ me sutaṃ - ekaṃ samayaṃ bhagavā sāvatthiyaṃ viharati. [8.199]
Thus have I heard—At one time the Blessed One was staying near Sāvatthī,
Jetavane anāthapiṇḍikassa ārāme. [5.640]
In Jeta’s Grove, in the monastery of Anāthapiṇḍika.
Tatra kho bhagavā bhikkhū āmantesi: “bhikkhavo”ti. [6.269]
There, the Blessed One addressed the monks: "O Monks."
“Bhadante”ti te bhikkhū bhagavato paccassosuṃ. Bhagavā etadavoca: [9.588]
"Venerable Sir," those monks replied to the Blessed One. The Blessed One said this:

“Bhūtapubbaṃ, bhikkhave, devāsurasaṅgāmo samupabyūḷho ahosi. [9.110]
"In the past, monks, a battle was arrayed between the Devas and the Asuras.
Atha kho, bhikkhave, sakko devānamindo deve tāvatiṃse āmantesi [9.436]
Then, monks, Sakka, Lord of the Devas, addressed the Devas of the Heaven of the Thirty-three:
‘Sace, mārisā, devānaṃ saṅgāmagatānaṃ [5.705]
'If, dear ones, to the Devas gone into battle,
Uppajjeyya bhayaṃ vā chambhitattaṃ vā lomahaṃso vā, [7.050]
there should arise fear, terror, or the standing of hair on end;
Mameva tasmiṃ samaye dhajaggaṃ ullokeyyātha. [6.356]
at that time, you should look up at the crest of my banner.
Mamaṃ hi vo dhajaggaṃ ullokayataṃ [5.293]
For when you look up at the crest of my banner,
Yaṃ bhavissati bhayaṃ vā chambhitattaṃ vā lomahaṃso vā, so pahīyissati. [8.980]
whatever fear, terror, or standing of hair on end there may be, it will be abandoned.

No ce me dhajaggaṃ ullokeyyātha, atha pajāpatissa devarājassa dhajaggaṃ ullokeyyātha. [10.390]
If you do not look up at the crest of my banner, then look up at the crest of the banner of Pajāpati, the king of gods.
Pajāpatissa hi vo devarājassa dhajaggaṃ ullokayataṃ [6.941]
For when you look up at the crest of the banner of Pajāpati, the king of gods,
Yaṃ bhavissati bhayaṃ vā chambhitattaṃ vā lomahaṃso vā, so pahīyissati. [8.503]
whatever fear, terror, or standing of hair on end there may be, it will be abandoned.

No ce pajāpatissa devarājassa dhajaggaṃ ullokeyyātha, [6.659]
If you do not look up at the crest of the banner of Pajāpati, the king of gods,
Atha varuṇassa devarājassa dhajaggaṃ ullokeyyātha. [6.139]
then look up at the crest of the banner of Varuṇa, the king of gods.
Varuṇassa hi vo devarājassa dhajaggaṃ ullokayataṃ [6.681]
For when you look up at the crest of the banner of Varuṇa, the king of gods,
Yaṃ bhavissati bhayaṃ vā chambhitattaṃ vā lomahaṃso vā, so pahīyissati. [9.436]
whatever fear, terror, or standing of hair on end there may be, it will be abandoned.

No ce varuṇassa devarājassa dhajaggaṃ ullokeyyātha, [6.312]
If you do not look up at the crest of the banner of Varuṇa, the king of gods,
Atha īsānassa devarājassa dhajaggaṃ ullokeyyātha. [6.030]
then look up at the crest of the banner of Īsāna, the king of gods.
Īsānassa hi vo devarājassa dhajaggaṃ ullokayataṃ [6.898]
For when you look up at the crest of the banner of Īsāna, the king of gods,
Yaṃ bhavissati bhayaṃ vā chambhitattaṃ vā lomahaṃso vā, so pahīyissatī’ti. [9.327]
whatever fear, terror, or standing of hair on end there may be, it will be abandoned.'

Taṃ kho pana, bhikkhave, sakkassa vā devānamindassa dhajaggaṃ ullokayataṃ, [8.742]
Now, monks, in those who look up at the crest of the banner of Sakka, Lord of Devas,
Pajāpatissa vā devarājassa dhajaggaṃ ullokayataṃ, [6.139]
or the crest of the banner of Pajāpati, the king of gods,
Varuṇassa vā devarājassa dhajaggaṃ ullokayataṃ, [6.182]
or the crest of the banner of Varuṇa, the king of gods,
Īsānassa vā devarājassa dhajaggaṃ ullokayataṃ [6.247]
or the crest of the banner of Īsāna, the king of gods,
Yaṃ bhavissati bhayaṃ vā chambhitattaṃ vā lomahaṃso vā, [6.442]
whatever fear, terror, or standing of hair on end there may be,
So pahīyethāpi nopi pahīyetha. Taṃ kissa hetu? [6.312]
might be abandoned or might not be abandoned. For what reason?
Sakko hi, bhikkhave, devānamindo avītarāgo avītadoso avītamoho [9.284]
Because Sakka, monks, Lord of Devas, is not free from greed, not free from hatred, not free from delusion;
Bhīru chambhī utrāsī palāyīti. [5.358]
he is subject to fear, terror, and alarm, and he flees.

Ahañca kho, bhikkhave, evaṃ vadāmi ‘sace tumhākaṃ, bhikkhave, [7.332]
But I, monks, say this: If, monks, to you
Araññagatānaṃ vā rukkhamūlagatānaṃ vā suññāgāragatānaṃ vā [7.418]
who have gone to the forest, or to the root of a tree, or to an empty hut,
Uppajjeyya bhayaṃ vā chambhitattaṃ vā lomahaṃso vā, [6.247]
there should arise fear, terror, or standing of hair on end,
Mameva tasmiṃ samaye anussareyyātha [5.163]
at that time you should only recollect me thus:

‘Itipi so bhagavā arahaṃ sammāsambuddho [6.182]
'Such indeed is the Blessed One: the Worthy One, the Fully Enlightened One,
Vijjācaraṇasampanno sugato lokavidū [5.726]
Endowed with knowledge and virtue, the Well-Gone One, the Knower of worlds,
Anuttaro purisadammasārathi satthā devamanussānaṃ buddho bhagavā’ti. [10.108]
The Incomparable Leader of persons to be tamed, the Teacher of gods and humans, the Enlightened One, the Blessed One.'
Mamaṃ hi vo, bhikkhave, anussarataṃ [4.685]
For, monks, when you recollect me,
Yaṃ bhavissati bhayaṃ vā chambhitattaṃ vā lomahaṃso vā, so pahīyissati. [8.742]
whatever fear, terror, or standing of hair on end there may be, it will be abandoned.

No ce maṃ anussareyyātha, atha dhammaṃ anussareyyātha [6.681]
If you do not recollect me, then you should recollect the Dhamma:
‘Svākkhāto bhagavatā dhammo [4.165]
'The Dhamma is well-expounded by the Blessed One,
Sandiṭṭhiko akāliko ehipassiko opaneyyiko [7.505]
Visible here and now, immediate in results, inviting one to come and see, leading onwards,
Paccattaṃ veditabbo viññūhī’ti. [4.924]
To be personally realized by the wise.'
Dhammaṃ hi vo, bhikkhave, anussarataṃ [4.620]
For, monks, when you recollect the Dhamma,
Yaṃ bhavissati bhayaṃ vā chambhitattaṃ vā lomahaṃso vā, so pahīyissati. [8.676]
whatever fear, terror, or standing of hair on end there may be, it will be abandoned.

No ce dhammaṃ anussareyyātha, atha saṅghaṃ anussareyyātha [7.136]
If you do not recollect the Dhamma, then you should recollect the Sangha:
‘Suppaṭipanno bhagavato sāvakasaṅgho [4.967]
'The Sangha of the Blessed One’s disciples is practicing the good way,
Ujuppaṭipanno bhagavato sāvakasaṅgho [4.967]
The Sangha of the Blessed One’s disciples is practicing the straight way,
Ñāyappaṭipanno bhagavato sāvakasaṅgho [5.141]
The Sangha of the Blessed One’s disciples is practicing the true way,
Sāmīcippaṭipanno bhagavato sāvakasaṅgho, [5.488]
The Sangha of the Blessed One’s disciples is practicing the proper way,
Yadidaṃ cattāri purisayugāni aṭṭha purisapuggalā [6.399]
That is, the four pairs of persons, the eight types of individuals.
Esa bhagavato sāvakasaṅgho, [4.056]
This Sangha of the Blessed One’s disciples
Āhuneyyo pāhuneyyo dakkhiṇeyyo añjalikaraṇīyo [7.397]
Is worthy of gifts, worthy of hospitality, worthy of offerings, worthy of respect,
Anuttaraṃ puññakkhettaṃ lokassā’ti. [4.881]
The incomparable field of merit for the world.'

Saṅghaṃ hi vo, bhikkhave, anussarataṃ [4.382]
For, monks, when you recollect the Sangha,
Yaṃ bhavissati bhayaṃ vā chambhitattaṃ vā lomahaṃso vā, so pahīyissati. [8.416]
whatever fear, terror, or standing of hair on end there may be, it will be abandoned.
Taṃ kissa hetu? Tathāgato hi, bhikkhave, arahaṃ sammāsambuddho [7.223]
For what reason? Because the Tathāgata, monks, the Worthy One, the Fully Enlightened One,
Vītarāgo vītadoso vītamoho abhīru acchambhī anutrāsī apalāyī”ti. [11.258]
Is free from greed, free from hatred, free from delusion; he is fearless, without terror, without alarm, and does not flee."

Idamavoca bhagavā. Idaṃ vatvāna sugato athāparaṃ etadavoca satthā [9.327]
The Blessed One said this. Having said this, the Well-Gone One, the Teacher, further said:
“Araññe rukkhamūle vā, suññāgāreva bhikkhavo; [6.074]
In the forest or at the root of a tree, or in an empty hut, O monks;
Anussaretha sambuddhaṃ, bhayaṃ tumhāka no siyā. [6.182]
Recollect the Enlightened One; fear will not be yours.
“No ce buddhaṃ sareyyātha, lokajeṭṭhaṃ narāsabhaṃ; [6.182]
If you do not recollect the Buddha, the Supreme One of the world, the Bull of men;
Atha dhammaṃ sareyyātha, niyyānikaṃ sudesitaṃ. [6.507]
Then recollect the Dhamma, the well-taught, which leads to liberation.
“No ce dhammaṃ sareyyātha, niyyānikaṃ sudesitaṃ; [6.421]
If you do not recollect the Dhamma, the well-taught, which leads to liberation;
Atha saṅghaṃ sareyyātha, puññakkhettaṃ anuttaraṃ. [6.421]
Then recollect the Sangha, the incomparable field of merit.
“Evaṃ buddhaṃ sarantānaṃ, dhammaṃ saṅghañca bhikkhavo; [7.136]
Thus, monks, for those who recollect the Buddha, the Dhamma, and the Sangha;
Bhayaṃ vā chambhitattaṃ vā, lomahaṃso na hessati. [8.705]
Fear, terror, or the standing of hair on end will never occur.`
},

{
    id: 'Āṭānāṭiya', title: '8. Āṭānāṭiyasutta', title_vn: '8. The Āṭānāṭiya Discourse', audio: '08-Atanatiyasutta.mp3',
    text: `Appasannehi Nāthassa, sāsane sādhusammate; [11.791]
Because there are those who are not pleased with the well-regarded Dispensation of the Protector;
Amanussehi caṇḍehi, sadā kibbisakāribhi. [7.675]
By fierce non-human beings who are always committing evil.
Parisānaṃ catassannaṃ, ahiṃsāya ca guttiyā; [7.397]
For the non-harming and protection of the fourfold assembly (monks, nuns, laymen, and laywomen);
Yaṃ desesi Mahāviro, parittaṃ taṃ bhaṇāma he. [8.115]
The Great Hero preached this; O Noble Ones, let us recite this protection!

Vipassissa ca namatthu, cakkhumantassa sirīmato; [6.407]
Homage to Vipassī (Buddha), possessed of vision and glory!
Sikhissapi ca namatthu, sabbabhūtānukampino. [6.220]
Homage to Sikhī (Buddha), who has compassion for all beings!
Vessabhussa ca namatthu, nhātakassa tapassino; [5.799]
Homage to Vessabhū (Buddha), the purified, the austere!
Namatthu kakusandhassa, mārasenāpamaddino. [6.361]
Homage to Kakusandha (Buddha), the crusher of Mara’s army!
Koṇāgamanassa namatthu, brāhmaṇassa vusīmato; [6.155]
Homage to Koṇāgamana (Buddha), the perfected Holy One!
Kassapassa ca namatthu, vippamuttassa sabbadhi. [5.753]
Homage to Kassapa (Buddha), who is fully released in every way!
Aṅgīrasassa namatthu, sakyaputtassa sirīmato; [6.314]
Homage to Aṅgīrasa (the Buddha Gotama), the glorious son of the Sakyans,
Yo imaṃ dhammaṃ desesi, sabbadukkhāpanūdanaṃ. [7.389]
Who taught this Dhamma for the removal of all suffering!

Ye cāpi nibbutā loke, yathābhūtaṃ vipassisuṃ; [7.226]
Those in the world who have attained Nibbāna, seeing things as they truly are;
Te janā apisuṇātha mahantā vītasāradā. [6.828]
Those people who are free from slander, the great ones, free from fear.
Hitaṃ devamanussānaṃ yaṃ namassanti Gotamaṃ; [6.477]
They pay homage to Gotama, the benefactor of gods and humans;
Vijjācaraṇasampannaṃ mahantaṃ vītasāradaṃ. [6.618]
Endowed with knowledge and conduct, the great one, free from fear!

Ete caññe ca sambuddhā, anekasatakoṭiyo; [6.828]
These and other Enlightened Ones, hundreds of millions of them;
Sabbe Buddhā samasamā, sabbe Buddhā mahiddhikā. [6.805]
All Buddhas are equal (in their Dhamma), all Buddhas are of great psychic power.
Sabbe dasabalūpetā, vesārajjehupāgatā; [6.384]
All are endowed with the ten powers and possess the four kinds of fearlessness;
Sabbe te paṭijānanti, āsabhaṃ ṭhānamuttamaṃ. [6.898]
They all acknowledge their supreme position as the "Bull among Men."
Sīhanādaṃ nadantete, parisāsu visāradā; [6.244]
They roar their lion's roar, confident in the midst of assemblies;
Brahmacakkaṃ pavattenti, loke appaṭivattiyaṃ. [6.477]
They set in motion the Divine Wheel (of Dhamma), which cannot be turned back in the world.

Upetā Buddha dhammehi, aṭṭhārasahi nāyakā; [6.477]
These Leaders are endowed with the eighteen qualities of a Buddha;
Bāttiṃsalakkhaṇupeta, sītānubyañjanādharā. [6.968]
Endowed with the thirty-two major marks and bearing the eighty minor characteristics.
Byāmappabhāya suppabhā, sabbe te munikuñjarā; [6.992]
Radiant with a fathom-wide halo, all of them are "Elephants among Sages";
Buddhā sabbaññuno ete, sabbe khīṇāsavā jinā. [7.343]
These Buddhas are all-knowing; they are all Victors who have destroyed the taints.
Mahāpabhā mahātejā, mahāpaññā mahabbalā; [6.454]
Of great radiance, great power, great wisdom, and great strength;
Mahākāruṇikā dhīrā, sabbesānaṃ sukhāvahā. [6.688]
Greatly compassionate and firm, they bring happiness to all beings.

Dīpā nāthā patiṭṭhā ca, tāṇā leṇā ca pāṇinaṃ; [7.039]
They are islands, protectors, a firm footing, a refuge, and a shelter for all beings;
Gatī bandhu mahassāsā, saraṇā ca hitesino. [7.647]
The destination, the kin, the great comforters, the refuge, and those who seek our welfare.
Sadevakassa lokassa, sabbe ete parāyaṇā; [6.781]
For the world including the gods, they are the ultimate support;
Tesāhaṃ sirasā pāde, vandāmi purisuttame. [7.460]
I bow my head to the feet of these supreme persons.

Vacasā manasā ceva, vandāmete Tathāgate; [6.665]
By speech and by mind, I pay homage to these Tathāgatas;
Sayane āsane ṭhāne, gamane cāpi sabbadā. [6.898]
While lying down, sitting, standing, or walking—at all times.
Sadā sukkhena rakkhantu, Buddhā santikarā tuvaṃ; [6.594]
May the Buddhas, the makers of peace, always protect you with happiness;
Tehi tvaṃ rakkhito santo, mutto sabbabhayehi ca. [7.202]
Being protected by them, may you be peaceful and free from all fears.
Sabbarogā vinīmutto, sabbasantāpa vajjito; [6.898]
May you be released from all diseases, avoid all burning afflictions;
Sabbaveramatikkanto, nibbuto ca tuvaṃ bhava. [6.999]
Having overcome all enmity, may you be cooled and at peace.

Tesaṃ saccena sīlena, khantimettābalena ca; [7.061]
By their truth, virtue, patience, and the power of their goodwill;
Tepi amhenurakkhantu, arogena sukhena ca. [7.269]
May they also protect us with health and happiness.

Puratthimasmiṃ disābhāge, santi bhūtā mahiddhikā; [7.231]
In the Eastern direction, there are beings of great power;
Tepi amhenurakkhantu, arogena sukhena ca. [7.202]
May they also protect us with health and happiness.
Dakkhiṇasmim disābhāge, santi devā mahiddhikā; [7.008]
In the Southern direction, there are gods of great power;
Tepi amhenurakkhantu, arogena sukhena ca. [7.620]
May they also protect us with health and happiness.
Pacchimasmiṃ disābhāge, santi nāgā mahiddhikā; [7.397]
In the Western direction, there are Nagas of great power;
Tepi amhenurakkhantu, arogena sukhena ca. [7.147]
May they also protect us with health and happiness.
Uttarasmiṃ disābhāge, santi yakkhā mahiddhikā; [7.008]
In the Northern direction, there are Yakkhas of great power;
Tepi amhenurakkhantu, arogena sukhena ca. [7.286]
May they also protect us with health and happiness.

Puratthimena Dhataraṭṭho, dakkhiṇena Virūḷhako; [6.785]
Dhataraṭṭha in the East, Virūḷhaka in the South;
Pacchimena Virūpakkho, Kuvero uttaraṃ disaṃ. [6.618]
Virūpakkha in the West, and Kuvera in the Northern direction.
Cattāro te mahārājā, lokapālā yasassino; [7.147]
These are the Four Great Kings, famous protectors of the world;
Tepi amhenurakkhantu, arogena sukhena ca. [7.063]
May they also protect us with health and happiness.

Ākāsaṭṭhā ca bhūmaṭṭha, devā nāgā mahiddhikā; [7.230]
Deities and Nagas of great power, dwelling in the sky and on the earth;
Tepi amhenurakkhantu, arogena sukhena ca. [7.008]
May they also protect us with health and happiness.
Iddhimanto ca ye devā, vasantā idha sāsane; [6.507]
The deities possessed of psychic power who dwell here in this Dispensation;
Tepi amhenurakkhantu, arogena sukhena ca. [7.063]
May they also protect us with health and happiness.

Sabbītiyo vivajjantu, soko rogo vinassatu; [6.674]
May all calamities be avoided; may sorrow and disease be destroyed;
Mā te bhavantvantarāyā, sukhī dīghāyuko bhava. [7.453]
May there be no obstacles for you; may you be happy and live long.
Abhivādanasīlissa, niccaṃ vuḍḍhāpacāyino; [6.702]
For one who is habituated to bowing and always respects the elders;
Cattāro dhammā vaḍḍhanti, āyu vaṇṇo sukhaṃ balaṃ. [8.698]
Four qualities increase: long life, beauty, happiness, and strength.`
},

{
    id: 'Aṅgulimāla', title: '9. Aṅgulimālasutta', title_vn: '9. The Aṅgulimāla Discourse', audio: '09-Angulimalasutta.mp3',
    text: `Parittaṃ yaṃ bhaṇantassa, nisinnaṭṭhānadhovanaṃ; [8.098]
The protection which, for one who recites it, even the water used to wash the seating place;
Udakampi vināseti, sabbameva parissayaṃ. [5.501]
Can dispel every single danger;
Sotthinā gabbhavuṭṭhānaṃ, yañca sādheti taṅkhaṇe; [6.204]
And which brings about a safe delivery from the womb in that very instant;
Therassaṅgulimalassa, Lokanāthena bhāsitaṃ; [5.653]
Spoken by the Protector of the World for the sake of the Elder Aṅgulimāla;
Kappaṭṭhāyiṃ mahātejaṃ, parittaṃ taṃ bhaṇāma he. [7.299]
O Noble Ones, let us now recite that protective chant of great majesty, which endures for an aeon.

“Yatohaṃ, bhagini, ariyāya jātiyā jāto, [5.929]
“Since I, sister, was born into the Noble Birth,
Nābhijānāmi sañcicca pāṇaṃ jīvitā voropetā, [6.754]
I do not recall intentionally depriving a living being of life.
Tena saccena sotthi te hotu, sotthi gabbhassa.” [6.648]
By this truth, may there be safety for you, and safety for your unborn child.”`
},

{
    id: 'Bojjhaṅga', title: '10. Bojjhaṅgasutta', title_vn: '10. Awakening Factors Discourse', audio: '10-Bojjhangasutta.mp3',
    text: `Saṃsāre saṃsarantānaṃ, sabbadukkhavināsane; [9.683]
For those wandering in Saṃsāra, which destroys all suffering;
Satta dhamme ca bojjhaṅge, mārasenāpamaddane. [6.617]
The seven factors of enlightenment, which crush the army of Māra.
Bujjhitvā ye cime sattā, tibhavā muttakuttamā; [6.213]
Having awakened to these, beings are released from the three realms and become supreme;
Ajātimajarābyādhiṃ, amataṃ nibbhayaṃ gatā. [6.899]
They reached the deathless and fearless state, free from birth, old age, and disease.
Evamādi guṇūpetaṃ, anekaguṇasaṅgahaṃ; [6.334]
Endowed with such qualities, a collection of manifold virtues;
Osadhañca imaṃ mantaṃ, bojjhaṅgañca bhaṇāma he. [6.859]
Let us recite this Bojjhaṅga protective chant, which is both a medicine and a mantra.

Bojjhaṅgo sati saṅkhāto, dhammānaṃ vicayo tathā; [6.576]
The factors of enlightenment known as Mindfulness and Investigation of phenomena;
Vīriyaṃ pīti passaddhi, bojjhaṅgā ca tathāpare. [6.738]
Also Energy, Rapture, and Tranquility as factors of enlightenment.
Samādhupekkhā bojjhaṅgā, sattete sabbadassinā; [7.101]
Concentration and Equanimity; these seven factors were seen by the All-Seeing One;
Muninā sammadakkhātā, bhāvitā bahulīkatā. [6.536]
Well-expounded by the Sage, developed and frequently practiced;
Saṃvattanti abhiññāya, nibbānāya ca bodhiyā; [6.576]
They lead to direct knowledge, to Nibbāna, and to Enlightenment;
Etena saccavajjena, sotthi te hotu sabbadā. [6.576]
By this statement of truth, may you always be well.

Ekasmiṃ samaye Nātho, Moggallānañca Kassapaṃ; [6.193]
On one occasion, the Protector saw the Elders Moggallāna and Kassapa;
Gilāne dukkhite disvā, bojjhaṅge satta desayi. [6.576]
Seeing them sick and in pain, He taught the seven factors of enlightenment.
Te ca taṃ abhinanditvā, rogā mucciṃsu taṅkhaṇe; [6.819]
They rejoiced in that, and were instantly freed from their illness;
Etena saccavajjena, sotthi te hotu sabbadā. [6.758]
By this statement of truth, may you always be well.

Ekadā Dhammarājāpi, gelaññenābhipīḷito; [6.375]
Once, the King of Dhamma himself was afflicted by illness;
Cundattherena taṃyeva, bhaṇāpetvāna sādaraṃ. [6.819]
He had the Elder Cunda recite that very chant with great respect.
Sammoditvāna ābādhā, tamhā vuṭṭhāsi ṭhānaso, [6.980]
Having rejoiced, He immediately rose up from that affliction;
Etena saccavajjena, sotthi te hotu sabbadā. [6.597]
By this statement of truth, may you always be well.

Pahīnā te ca ābādhā, tiṇṇannampi mahesinaṃ; [6.718]
Those afflictions were entirely abandoned by the three Great Sages;
Maggahatā kilesāva, pattānuppattidhammataṃ; [6.617]
Just as defilements are destroyed by the Path, never to arise again;
Etena saccavajjena, sotthi te hotu sabbadā. [7.806]
By this statement of truth, may you always be well.`
},

{
    id: 'Pubbaṇha', title: '11. Pubbaṇhasutta', title_vn: '11. The Morning Discourse', audio: '11-Pubbanhasutta.mp3',
    text: `Yaṃ dunnimittaṃ avamaṅgalañca, yo cāmanāpo sakuṇassa saddo; [11.880]
Whatever bad omen or inauspicious event, and the displeasing cry of birds;
Pāpaggaho dussupinaṃ akantaṃ, Buddhānubhāvena vināsamentu [9.306]
The evil influence of planets or unpleasant dreams—by the power of the Buddha, may they be destroyed.
Yaṃ dunnimittaṃ avamaṅgalañca, yo cāmanāpo sakuṇassa saddo; [8.147]
Whatever bad omen or inauspicious event, and the displeasing cry of birds;
Pāpaggaho dussupinaṃ akantaṃ, Dhammānubhāvena vināsamentu [9.052]
The evil influence of planets or unpleasant dreams—by the power of the Dhamma, may they be destroyed.
Yaṃ dunnimittaṃ avamaṅgalañca, yo cāmanāpo sakuṇassa saddo; [8.090]
Whatever bad omen or inauspicious event, and the displeasing cry of birds;
Pāpaggaho dussupinaṃ akantaṃ, Saṅghānubhāvena vināsamentu [9.363]
The evil influence of planets or unpleasant dreams—by the power of the Sangha, may they be destroyed.

Dukkhappattā ca nidukkhā, bhayappattā ca nibbhayā; [6.308]
May those who have fallen into suffering be free from suffering, and those who have fallen into fear be free from fear;
Sokappattā ca nissokā, hontu sabbepi pāṇino. [6.647]
May those who have fallen into sorrow be free from sorrow—may all living beings be so.
Ettāvatā ca amhehi sambhataṃ puññasampadaṃ; [6.619]
May all celestial beings rejoice in the shared merit we have thus far accumulated;
Sabbe devānumodantu sabbasampattisiddhiyā. [6.327]
For the sake of achieving all types of success and prosperity.

Dānaṃ dadantu saddhāya, sīlaṃ rakkhantu sabbadā; [6.674]
May they give gifts with faith, and always guard their virtue;
Bhāvanābhiratā hontu, gacchantu devatāgatā. [6.541]
May they delight in meditation; and may the visiting deities now depart.
Sabbe Buddhā balappattā, paccekānañca yaṃ balaṃ; [6.922]
By the power of all the Buddhas, and the power of the Silent Buddhas;
Arahantānañca tejena, rakkhaṃ bandhāmi sabbaso. [7.493]
And by the majesty of the Arahants, I bind this protection in every way.

Yaṃ kiñci vittaṃ idha vā huraṃ vā, saggesu vā yaṃ ratanaṃ paṇītaṃ; [9.300]
Whatever wealth there is here or in other worlds, or whatever sublime treasure in the heavens;
Na no samaṃ atthi tathāgatena, [4.662]
There is none equal to the Tathāgata (the Thus-Gone One);
Idampi Buddhe ratanaṃ paṇītaṃ; etena saccena suvatthi hotu. [8.991]
In the Buddha is this precious treasure; by this truth, may there be well-being.
Yaṃ kiñci vittaṃ idha vā huraṃ vā, saggesu vā yaṃ ratanaṃ paṇītaṃ; [9.039]
Whatever wealth there is here or in other worlds, or whatever sublime treasure in the heavens;
Na no samaṃ atthi tathāgatena, [4.329]
There is none equal to the Tathāgata (the Thus-Gone One);
Idampi Dhamme ratanaṃ paṇītaṃ; etena saccena suvatthi hotu. [8.634]
In the Dhamma is this precious treasure; by this truth, may there be well-being.
Yaṃ kiñci vittaṃ idha vā huraṃ vā, saggesu vā yaṃ ratanaṃ paṇītaṃ; [9.015]
Whatever wealth there is here or in other worlds, or whatever sublime treasure in the heavens;
Na no samaṃ atthi tathāgatena, [4.353]
There is none equal to the Tathāgata (the Thus-Gone One);
Idampi Saṅghe ratanaṃ paṇītaṃ; etena saccena suvatthi hotu. [8.991]
In the Sangha is this precious treasure; by this truth, may there be well-being.

Bhavatu sabbamaṅgalaṃ, rakkhantu sabbadevatā; [5.614]
May there be every blessing, may all the deities protect you;
Sabba Buddhānubhāvena, sadā sukhī bhavantu te. [6.946]
By the power of all the Buddhas, may you always be happy.
Bhavatu sabbamaṅgalaṃ, rakkhantu sabbadevatā; [5.471]
May there be every blessing, may all the deities protect you;
Sabba Dhammānubhāvena, sadā sukhī bhavantu te. [6.850]
By the power of all the Dhamma, may you always be happy.
Bhavatu sabbamaṅgalaṃ, rakkhantu sabbadevatā; [5.471]
May there be every blessing, may all the deities protect you;
Sabba Saṅghānubhāvena, sadā sukhī bhavantu te. [7.231]
By the power of all the Sangha, may you always be happy.

Mahākāruṇiko Nātho, hitāya sabbapāṇinaṃ; [6.327]
The Great Compassionate Protector, for the welfare of all living beings;
Pūretvā pāramī sabbā, patto sambodhimuttamaṃ; [5.851]
Having fulfilled all the perfections, attained supreme enlightenment;
Etena saccavajjena, sotthi te hotu sabbadā. [7.017]
By this statement of truth, may you always be safe.

Jayanto bodhiyā mūle, Sakyānaṃ nandivaḍḍhano, [6.565]
Victorious at the foot of the Bodhi tree, increasing the joy of the Sakyans;
Evameva jayo hotu, jayassu jayamaṅgale. [6.184]
In the same way, may you be victorious; may you win the victory of blessings.
Aparājitapallaṅke, sīse puthuvipukkhale, [6.022]
On the unconquered throne, at the highest point of the earth;
Abhiseke sabbabuddhānaṃ, aggappatto pamodati. [6.660]
At the place of consecration of all the Buddhas, He rejoiced in the highest attainment.

Sunakkhattaṃ sumaṅgalaṃ suppabhātaṃ suhuṭṭhitaṃ; [6.755]
A lucky star, a great blessing, a beautiful dawn, a favorable awakening;
Sukhaṇo sumuhutto ca, suyiṭṭhaṃ brahmacārisu. [6.589]
A fortunate moment, a good instant, and a worthy offering to the holy life practitioners.
Padakkhiṇaṃ kāyakammaṃ vācākammaṃ padakkhiṇaṃ [6.303]
Righteous are the bodily actions, righteous are the verbal actions;
Padakkhiṇaṃ manokammaṃ paṇīdhi te padakkhiṇe. [6.280]
Righteous are the mental actions, righteous are the aspirations.
Padakkhiṇāni katvāna, labhantatthe padakkhiṇe. [6.042]
By performing these righteous deeds, one obtains righteous benefits.
Te atthaladdhā sukhitā viruḷhā Buddhasāsane; [7.112]
May you obtain benefits, find happiness, and grow in the Buddha's Teaching;
Arogā sukhitā hotha, saha sabbehi ñātibhi. [8.455]
May you be free from disease and happy, together with all your relatives.`
},

{
    id: 'Anekajati', title: 'Anekajāti Pāḷi ', title_vn: 'The Victory Verses', audio: '12-Anekajati.mp3',
    text: `Namo tassa bhagavato arahato sammāsambuddhassa. [11.002]
Homage to Him, the Blessed One, the Worthy One, the Fully Enlightened One.
Namo tassa bhagavato arahato sammāsambuddhassa. [11.596]
Homage to Him, the Blessed One, the Worthy One, the Fully Enlightened One.
Namo tassa bhagavato arahato sammāsambuddhassa. [11.299]
Homage to Him, the Blessed One, the Worthy One, the Fully Enlightened One.

Anekajātisaṃsāraṃ, sandhāvissaṃ anibbisaṃ; [7.582]
Through many births in wandering (Samsara), I have run, seeking but not finding;
gahakāraṃ gavesanto, dukkhā jāti punappunaṃ. [7.211]
The builder of this house; painful is birth again and again.
gahakāraka diṭṭhosi, puna gehaṃ na kāhasi; [6.467]
O house-builder, you are seen! You shall build no house again;
sabbā te phāsukā bhaggā, gahakūṭaṃ visaṅkhataṃ; [6.765]
All your rafters are broken, the ridgepole is destroyed;
visaṅkhāragataṃ cittaṃ, taṇhānaṃ khayamajjhagā. [7.359]
My mind has reached the Unconditioned, I have attained the destruction of craving.

Anekajātisaṃsāraṃ, sandhāvissaṃ anibbisaṃ; [6.839]
Through many births in wandering (Samsara), I have run, seeking but not finding;
gahakāraṃ gavesanto, dukkhā jāti punappunaṃ. [6.542]
The builder of this house; painful is birth again and again.
gahakāraka diṭṭhosi, puna gehaṃ na kāhasi; [5.872]
O house-builder, you are seen! You shall build no house again;
sabbā te phāsukā bhaggā, gahakūṭaṃ visaṅkhataṃ; [6.467]
All your rafters are broken, the ridgepole is destroyed;
visaṅkhāragataṃ cittaṃ, taṇhānaṃ khayamajjhagā. [6.839]
My mind has reached the Unconditioned, I have attained the destruction of craving.

Anekajātisaṃsāraṃ, sandhāvissaṃ anibbisaṃ; [6.170]
Through many births in wandering (Samsara), I have run, seeking but not finding;
gahakāraṃ gavesanto, dukkhā jāti punappunaṃ. [6.557]
The builder of this house; painful is birth again and again.
gahakāraka diṭṭhosi, puna gehaṃ na kāhasi; [5.569]
O house-builder, you are seen! You shall build no house again;
sabbā te phāsukā bhaggā, gahakūṭaṃ visaṅkhataṃ; [6.188]
All your rafters are broken, the ridgepole is destroyed;
visaṅkhāragataṃ cittaṃ, taṇhānaṃ khayamajjhagā. [6.895]
My mind has reached the Unconditioned, I have attained the destruction of craving.

Iti imasmiṃ sati idaṃ hoti, imassuppādā idaṃ uppajjati, [10.254]
When this exists, that comes to be. With the arising of this, that arises. Namely:
yadidaṃ – avijjāpaccayā saṅkhārā, saṅkhārapaccayā viññāṇaṃ, [7.205]
Conditioned by ignorance, volitional formations arise; conditioned by volitional formations, consciousness;
viññāṇapaccayā nāmarūpaṃ, nāmarūpapaccayā saḷāyatanaṃ, [7.116]
Conditioned by consciousness, name-and-form; conditioned by name-and-form, the six sense bases;
saḷāyatanapaccayā phasso, phassapaccayā vedanā, [6.055]
Conditioned by the six sense bases, contact; conditioned by contact, feeling;
vedanāpaccayā taṇhā, taṇhāpaccayā upādānaṃ, [6.100]
Conditioned by feeling, craving; conditioned by craving, clinging;
upādānapaccayā bhavo, bhavapaccayā jāti, [5.569]
Conditioned by clinging, existence; conditioned by existence, birth;
jātipaccayā jarāmaraṇaṃ sokaparidevadukkhadomanassupāyāsā sambhavanti. [8.707]
Conditioned by birth, there arise aging and death, sorrow, lamentation, pain, grief, and despair.
Evametassa kevalassa dukkhakkhandhassa samudayo hoti. [7.558]
Thus is the origin of this whole mass of suffering.

Yadā have pātubhavanti dhammā; ātāpino jhāyato brāhmaṇassa; [7.823]
Truly, when the Dhamma becomes manifest to the ardent, meditating Brahmin;
athassa kaṅkhā vapayanti sabbā; yato pajānāti sahetudhammaṃ. [8.707]
Then all his doubts vanish, as he understands things together with their causes.

Iti imasmiṃ asati idaṃ na hoti, imassa nirodhā idaṃ nirujjhati, [9.989]
When this does not exist, that does not come to be. With the cessation of this, that ceases. Namely:
yadidaṃ – avijjānirodhā saṅkhāranirodho, [5.437]
Through the cessation of ignorance, volitional formations cease;
saṅkhāranirodhā viññāṇanirodho, [4.420]
Through the cessation of volitional formations, consciousness ceases;
viññāṇanirodhā nāmarūpanirodho, [4.420]
Through the cessation of consciousness, name-and-form ceases;
nāmarūpanirodhā saḷāyatananirodho, [5.171]
Through the cessation of name-and-form, the six sense bases cease;
saḷāyatananirodhā phassanirodho, [4.243]
Through the cessation of the six sense bases, contact ceases;
phassanirodhā vedanānirodho, [3.845]
Through the cessation of contact, feeling ceases;
vedanānirodhā taṇhānirodho, [4.022]
Through the cessation of feeling, craving ceases;
taṇhānirodhā upādānanirodho, [4.15]
Through the cessation of craving, clinging ceases;
upādānanirodhā bhavanirodho, [4.376]
Through the cessation of clinging, existence ceases;
bhavanirodhā jātinirodho, [3.669]
Through the cessation of existence, birth ceases;
jātinirodhā jarāmaraṇaṃ sokaparidevadukkhadomanassupāyāsā nirujjhanti. [7.823]
Through the cessation of birth, aging and death, sorrow, lamentation, pain, grief, and despair cease.
Evametassa kevalassa dukkhakkhandhassa nirodho hoti. [6.763]
Thus is the cessation of this whole mass of suffering.

Yadā have pātubhavanti dhammā; ātāpino jhāyato brāhmaṇassa; [6.984]
Truly, when the Dhamma becomes manifest to the ardent, meditating Brahmin;
athassa kaṅkhā vapayanti sabbā; yato khayaṃ paccayānaṃ avedi. [7.691]
Then all his doubts vanish, as he understands the destruction of causes.

Iti imasmiṃ sati idaṃ hoti, imassuppādā idaṃ uppajjati, [9.459]
When this exists, that comes to be. With the arising of this, that arises.
imasmiṃ asati idaṃ na hoti, imassa nirodhā idaṃ nirujjhati, [9.238]
When this does not exist, that does not come to be. With the cessation of this, that ceases. Namely:
yadidaṃ – avijjāpaccayā saṅkhārā, saṅkhārapaccayā viññāṇaṃ, [6.807]
Conditioned by ignorance, volitional formations; conditioned by volitional formations, consciousness;
viññāṇapaccayā nāmarūpaṃ, nāmarūpapaccayā saḷāyatanaṃ, [6.674]
Conditioned by consciousness, name-and-form; conditioned by name-and-form, the six sense bases;
saḷāyatanapaccayā phasso, phassapaccayā vedanā, [5.613]
Conditioned by the six sense bases, contact; conditioned by contact, feeling;
vedanāpaccayā taṇhā, taṇhāpaccayā upādānaṃ, [5.702]
Conditioned by feeling, craving; conditioned by craving, clinging;
upādānapaccayā bhavo, bhavapaccayā jāti, [5.171]
Conditioned by clinging, existence; conditioned by existence, birth;
jātipaccayā jarāmaraṇaṃ sokaparidevadukkhadomanassupāyāsā sambhavanti. [7.868]
Conditioned by birth, there arise aging and death, sorrow, lamentation, pain, grief, and despair.
Evametassa kevalassa dukkhakkhandhassa samudayo hoti. [6.497]
Thus is the origin of this whole mass of suffering.

Avijjāya tveva asesavirāganirodhā saṅkhāranirodho, [6.674]
Through the complete fading away and cessation of ignorance, volitional formations cease;
saṅkhāranirodhā viññāṇanirodho, [4.420]
Through the cessation of volitional formations, consciousness ceases;
viññāṇanirodhā nāmarūpanirodho, [4.464]
Through the cessation of consciousness, name-and-form ceases;
nāmarūpanirodhā saḷāyatananirodho, [4.774]
Through the cessation of name-and-form, the six sense bases cease;
saḷāyatananirodhā phassanirodho, [4.022]
Through the cessation of the six sense bases, contact ceases;
phassanirodhā vedanānirodho, [3.713]
Through the cessation of contact, feeling ceases;
vedanānirodhā taṇhānirodho, [3.978]
Through the cessation of feeling, craving ceases;
taṇhānirodhā upādānanirodho, [4.022]
Through the cessation of craving, clinging ceases;
upādānanirodhā bhavanirodho, [3.757]
Through the cessation of clinging, existence ceases;
bhavanirodhā jātinirodho, [3.934]
Through the cessation of existence, birth ceases;
jātinirodhā jarāmaraṇaṃ sokaparidevadukkhadomanassupāyāsā nirujjhanti. [8.531]
Through the cessation of birth, aging and death, sorrow, lamentation, pain, grief, and despair cease.
Evametassa kevalassa dukkhakkhandhassa nirodho hoti. [6.674]
Thus is the cessation of this whole mass of suffering.

Yadā have pātubhavanti dhammā; ātāpino jhāyato brāhmaṇassa; [7.072]
Truly, when the Dhamma becomes manifest to the ardent, meditating Brahmin;
vidhūpayaṃ tiṭṭhati mārasenaṃ; sūriyova obhāsayamantalikkhaṃ. [7.956]
Dispelling the army of Māra, he stands, just as the sun illuminates the sky.

Hetupaccayo, ārammaṇapaccayo, [4.685]
Root condition, Object condition,
adhipatipaccayo, anantarapaccayo, [4.155]
Predominance condition, Proximity condition,
samanantarapaccayo, sahajātapaccayo, [4.597]
Contiguity condition, Co-nascence condition,
aññamaññapaccayo, nissayapaccayo, [4.376]
Mutuality condition, Support condition,
upanissayapaccayo, purejātapaccayo, [4.553]
Decisive Support condition, Pre-existence condition,
pacchājātapaccayo, āsevanapaccayo, [4.553]
Post-existence condition, Repetition condition,
kammapaccayo, vipākapaccayo, [4.155]
Karma condition, Result condition,
āhārapaccayo, indriyapaccayo, [4.199]
Nutriment condition, Faculty condition,
jhānapaccayo, maggapaccayo, [3.713]
Jhāna condition, Path condition,
sampayuttapaccayo, vippayuttapaccayo, [4.243]
Association condition, Dissociation condition,
atthipaccayo, natthipaccayo, [3.536]
Presence condition, Absence condition,
vigatapaccayo, avigatapaccayoti. [5.486]
Separation condition, Non-separation condition.

Jayanto bodhiyā mūle, Sakyānaṃ nandivaḍḍhano, [6.000]
Victorious at the foot of the Bodhi tree, increasing the joy of the Sakyans;
Evameva jayo hotu, jayassu jayamaṅgale. [5.426]
In the same way, may you be victorious; may you win the victory of blessings.
Aparājitapallaṅke, sīse puthuvipukkhale, [5.018]
On the unconquered throne, at the highest point of the earth;
Abhiseke sabbabuddhānaṃ, aggappatto pamodati. [5.501]
At the place of consecration of all the Buddhas, He rejoiced in the highest attainment.

Sunakkhattaṃ sumaṅgalaṃ suppabhātaṃ suhuṭṭhitaṃ; [5.241]
A lucky star, a great blessing, a beautiful dawn, a favorable awakening;
sukhaṇo sumuhutto ca, suyiṭṭhaṃ brahmacārisu. [5.241]
A fortunate moment, a good instant, and a worthy offering to the holy life practitioners.
Padakkhiṇaṃ kāyakammaṃ vācākammaṃ padakkhiṇaṃ [4.869]
Righteous are the bodily actions, righteous are the verbal actions;
Padakkhiṇaṃ manokammaṃ paṇīdhi te padakkhiṇe. [4.500]
Righteous are the mental actions, righteous are the aspirations.
Padakkhiṇāni katvāna, labhantatthe padakkhiṇe. [5.241]
By performing these righteous deeds, one obtains righteous benefits.
Te atthaladdhā sukhitā viruḷhā Buddhasāsane; [4.795]
May you obtain benefits, find happiness, and grow in the Buddha's Teaching;
Arogā sukhitā hotha, saha sabbehi ñātibhi. [5.687]
May you be free from disease and happy, together with all your relatives.

Bhavatu sabbamaṅgalaṃ, rakkhantu sabbadevatā; [4.980]
May there be every blessing, may all the deities protect you;
Sabba Buddhānubhāvena, sadā sukhī bhavantu te. [5.612]
By the power of all the Buddhas, may you always be happy.
Bhavatu sabbamaṅgalaṃ, rakkhantu sabbadevatā; [4.795]
May there be every blessing, may all the deities protect you;
Sabba Dhammānubhāvena, sadā sukhī bhavantu te. [5.538]
By the power of all the Dhamma, may you always be happy.
Bhavatu sabbamaṅgalaṃ, rakkhantu sabbadevatā; [4.720]
May there be every blessing, may all the deities protect you;
Sabba Saṅghānubhāvena, sadā sukhī bhavantu te. [6.802]
By the power of all the Sangha, may you always be happy.
Sādhu Sādhu Sādhu. [7.451]
Well said! Well said! Well said!`
},

{
    id: 'Paccavekkhaṇā', title: 'Paccavekkhaṇā', title_vn: 'Requisites Reflections', audio: '13-Paccavekkhana.mp3',
    text: `Paṭisaṅkhā yoniso cīvaraṃ paṭisevāmi [6.660]
Reflecting wisely, I use the robe,
yāvadeva sītassa paṭighātāya, uṇhassa paṭighātāya, [9.399]
only for warding off cold, for warding off heat,
ḍaṃsa makasa vātātapa sarīsapa samphassānaṃ paṭighātāya, [8.022]
for warding off the touch of gadflies, mosquitoes, wind, sun, and reptiles,
yāvadeva hirikopīnappaṭicchādanatthaṃ. [6.560]
and only for the purpose of covering the parts of the body that cause shame.

Paṭisaṅkhā yoniso piṇḍapātaṃ paṭisevāmi [5.939]
Reflecting wisely, I use almsfood,
neva davāya, na madāya, na maṇḍanāya, na vibhūsanāya, [7.269]
neither for amusement, nor for intoxication, nor for physical beauty and attractiveness,
yāvadeva imassa kāyassa ṭhitiyā [6.072]
but only for the endurance and continuance of this body,
yāpanāya, vihiṃsūparatiyā, brahmacariyānuggahāya, [6.737]
for ending discomfort, and for assisting the Holy Life,
iti purāṇañca vedanaṃ paṭihaṅkhāmi [5.008]
considering, 'Thus I shall terminate old feelings,
navañca vedanaṃ na uppādessāmi, [4.388]
and I shall not produce new feelings,'
yātrā ca me bhavissati anavajjatā ca phāsuvihāro ca. [7.491]
and I shall be healthy, blameless, and live in comfort.

Paṭisaṅkhā yoniso senāsanaṃ paṭisevāmi [5.673]
Reflecting wisely, I use the lodging,
yāvadeva sītassa paṭighātāya, uṇhassa paṭighātāya, [8.466]
only for warding off cold, for warding off heat,
ḍaṃsa makasa vātātapa sarīsapa samphassānaṃ paṭighātāya, [6.914]
for warding off the touch of gadflies, mosquitoes, wind, sun, and reptiles,
yāvadeva utuparissaya vinodana paṭisallānārāmatthaṃ. [7.446]
only for removing the danger from the seasons and for the sake of enjoying seclusion.

Paṭisaṅkhā yoniso gilānappaccaya bhesajja parikkhāraṃ paṭisevāmi [7.047]
Reflecting wisely, I use medicinal requisites for the sick,
yāvadeva uppannānaṃ veyyābādhikānaṃ vedanānaṃ paṭighātāya, [7.136]
only for warding off painful feelings that have arisen,
abyāpajjaparamatāya. [4.234]
for the sake of the highest freedom from disease.`
},

{
    id: 'Pabbajita', title: 'Pabbajita-abhiṇhasutta', title_vn: 'Renunciants Frequent Reflections', audio: '14-Pabbajita-abhiṇhasutta.mp3',
    text: `Dasayime, bhikkhave, dhammā pabbajitena abhiṇhaṃ paccavekkhitabbā. [7.811]
"Monks, there are these ten things that should be frequently reflected upon by one who has gone forth."
Katame dasa? [3.007]
"What are the ten?"
1. Vevaṇṇiyamhi ajjhupagato"ti [4.151]
1. "'I have entered into a classless state (a different appearance),'"
pabbajitena abhiṇhaṃ paccavekkhitabbaṃ; [4.738]
should be frequently reflected upon by one who has gone forth.
2. Parapaṭibaddhā me jīvikā"ti [4.025]
2. "'My livelihood is dependent on others,'"
pabbajitena abhiṇhaṃ paccavekkhitabbaṃ; [4.948]
should be frequently reflected upon by one who has gone forth.
3. Añño me ākappo karaṇīyo"ti [4.235]
3. "'My demeanor should be different (from that of a householder),'"
pabbajitena abhiṇhaṃ paccavekkhitabbaṃ; [4.738]
should be frequently reflected upon by one who has gone forth.
4. Kacci nu kho me attā sīlato na upavadatī"ti [5.660]
4. "'Does my own self reproach me regarding my virtue?'"
pabbajitena abhiṇhaṃ paccavekkhitabbaṃ; [4.864]
should be frequently reflected upon by one who has gone forth.
5. Kacci nu kho maṃ anuvicca viññū sabrahmacārī [5.241]
5. "'Do wise fellow-practitioners of the Holy Life, after investigation,
sīlato na upavadantī"ti [3.857]
reproach me regarding my virtue?'"
pabbajitena abhiṇhaṃ paccavekkhitabbaṃ; [5.053]
should be frequently reflected upon by one who has gone forth.
6. Sabbehi me piyehi manāpehi [4.151]
6. "'From all that is dear and pleasing to me,
nānābhāvo vinābhāvo"ti [3.732]
there must be change and separation,'"
pabbajitena abhiṇhaṃ paccavekkhitabbaṃ; [4.822]
should be frequently reflected upon by one who has gone forth.
7. Kammassakomhi kammadāyādo kammayoni kammabandhu [7.925]
7. "'I am the owner of my actions, heir to my actions, born of my actions, related to my actions,
kammapaṭisaraṇo, yaṃ kammaṃ karissāmi kalyāṇaṃ vā pāpakaṃ vā [7.547]
and have my actions as my refuge; whatever action I do, whether good or evil,
tassa dāyādo bhavissāmī"ti [3.606]
to that I shall fall heir,'"
pabbajitena abhiṇhaṃ paccavekkhitabbaṃ; [5.367]
should be frequently reflected upon by one who has gone forth.
8. Kathaṃbhūtassa me rattindivā vītivattantī"ti [5.283]
8. "'How are my nights and days passing for me?'"
pabbajitena abhiṇhaṃ paccavekkhitabbaṃ; [5.451]
should be frequently reflected upon by one who has gone forth.
9. Kacci nu kho ahaṃ suññāgāre abhiramāmī"ti [5.283]
9. "'Do I delight in empty dwellings?'"
pabbajitena abhiṇhaṃ paccavekkhitabbaṃ; [4.780]
should be frequently reflected upon by one who has gone forth.
10. Atthi nu kho me uttari manussadhammo [4.696]
10. "'Have I attained any superhuman state,
alamariyañāṇadassanaviseso adhigato, [4.864]
a distinction in knowledge and vision worthy of the Noble Ones,
yenāhaṃ pacchime kāle sabrahmacārīhi puṭṭho [5.493]
such that when I am questioned by my fellow-practitioners in my final hours,
na maṅku bhavissāmī"ti [3.103]
I shall not be embarrassed?'"
pabbajitena abhiṇhaṃ paccavekkhitabbaṃ. [5.241]
should be frequently reflected upon by one who has gone forth.
Ime kho, bhikkhave, dasa dhammā [3.774]
"These, monks, are the ten things,"
pabbajitena abhiṇhaṃ paccavekkhitabbā. [5.710]
"that should be frequently reflected upon by one who has gone forth."`
},
{
    id: 'Pattidana', title: 'Mettābhāvanā', title_vn: 'Aspiration – Sharing of Merits', audio: '15-Pattidana.mp3',
text: `Sabbe sattā, sabbe pāṇā, [3.709]
May all beings, all breathing things,
sabbe bhūtā, sabbe puggalā, [3.398]
all creatures, all individuals,
sabbe attabhāvapariyāpannā, [3.832]
all personalities (all those embodied),
sabbā itthiyo, sabbe purisā, [3.934]
all women, all men,
sabbe ariyā, sabbe anariyā, [3.461]
all Noble Ones, all worldlings,
sabbe devā, sabbe manussā, [3.177]
all deities, all human beings,
sabbe vinipātikā [3.238]
all those in the four states of deprivation—
averā hontu, abyāpajjā hontu, [4.470]
may they be free from enmity, free from ill-will,
anīghā hontu, sukhī attānaṃ pariharantu. [4.959]
may they be free from suffering, and may they keep themselves happy.
Dukkhā muccantu, yathāladdhasampattito [4.371]
May they be released from suffering; may they not be deprived of their attained fortune;
māvigacchantu kammassakā. [4.039]
may it not be lost; for they are the owners of their karma.

Puratthimāya disāya, pacchimāya disāya, [5.343]
In the Eastern direction, in the Western direction,
uttarāya disāya, dakkhiṇāya disāya, [4.882]
in the Northern direction, in the Southern direction,
puratthimāya anudisāya, pacchimāya anudisāya, [5.419]
in the Southeast, in the Northwest,
uttarāya anudisāya, dakkhiṇāya anudisāya, [5.189]
in the Northeast, in the Southwest,
heṭṭhimāya disāya, uparimāya disāya. [5.010]
In the direction below, and in the direction above.

Sabbe sattā, sabbe pāṇā, [3.604]
May all beings, all breathing things,
sabbe bhūtā, sabbe puggalā, [3.144]
all creatures, all individuals,
sabbe attabhāvapariyāpannā, [3.604]
all personalities,
sabbā itthiyo, sabbe purisā, [3.655]
all women, all men,
sabbe ariyā, sabbe anariyā, [3.528]
all Noble Ones, all worldlings,
sabbe devā, sabbe manussā, [3.093]
all deities, all human beings,
sabbe vinipātikā [3.144]
all those in the four states of deprivation—
averā hontu, abyāpajjā hontu, [4.473]
may they be free from enmity, free from ill-will,
anīghā hontu, sukhī attānaṃ pariharantu. [4.985]
may they be free from suffering, and may they keep themselves happy.
Dukkhā muccantu, yathāladdhasampattito [4.473]
May they be released from suffering; may they not be deprived of their attained fortune;
māvigacchantu kammassakā. [3.834]
may it not be lost; for they are the owners of their karma.

Uddhaṃ yāva bhavaggā ca, adho yāva avīcito; [5.700]
Upwards to the highest peak of existence, downwards to the lowest hell;
Samantā cakkavāḷesu, ye sattā pathavīcarā; [5.470]
Throughout the entire universe, whatever beings live on land;
Abyāpajjā niverā ca, niddukkhā cā"nuppaddavā. [5.547]
May they be free from ill-will and enmity, free from suffering and danger.

Uddhaṃ yāva bhavaggā ca, adho yāva avīcito; [5.394]
Upwards to the highest peak of existence, downwards to the lowest hell;
Samantā cakkavāḷesu, ye sattā udakecarā; [5.521]
Throughout the entire universe, whatever beings live in the water;
Abyāpajjā niverā ca, niddukkhā cā"nuppaddavā. [5.649]
May they be free from ill-will and enmity, free from suffering and danger.

Uddhaṃ yāva bhavaggā ca, adho yāva avīcito; [5.343]
Upwards to the highest peak of existence, downwards to the lowest hell;
Samantā cakkavāḷesu, ye sattā ākāsecarā; [5.189]
Throughout the entire universe, whatever beings live in the air;
Abyāpajjā niverā ca, niddukkhā cā"nuppaddavā. [5.496]
May they be free from ill-will and enmity, free from suffering and danger.

Yaṃ pattaṃ kusalaṃ tassa, ānubhāvena pāṇino; [5.343]
By the power of the merit thus attained, may all living beings;
sabbe saddhammarājassa, ñatvā dhammaṃ sukhāvahaṃ. [5.573]
Knowing the Dhamma of the King of Truth which brings happiness;
Pāpuṇantu visuddhāya, sukhāya paṭipattiyā; [5.445]
Attain the path of purity and happiness;
asokamanupāyāsaṃ, nibbānasukhamuttamaṃ. [5.598]
Free from sorrow and despair, may they realize the supreme bliss of Nibbāna.

Ciraṃ tiṭṭhatu saddhammo, dhamme hontu sagāravā; [5.700]
May the True Dhamma endure long; may all beings respect the Dhamma;
sabbepi sattā kālena, sammā devo pavassatu. [5.445]
May the rain fall in due season;
Yathā rakkhiṃsu porāṇā, surājāno tathevimaṃ; [5.675]
Just as the righteous kings of old protected the people according to the Dhamma;
rājā rakkhatu dhammena, attanova pajaṃ pajaṃ. [5.521]
May the ruler protect the people with righteousness as if they were his own children.

Imāya dhammānudhammapaṭipattiyā Buddhaṃ pūjemi. [5.726]
By this practice of the Dhamma in its completeness, I honor the Buddha.
Imāya dhammānudhammapaṭipattiyā Dhammaṃ pūjemi. [6.058]
By this practice of the Dhamma in its completeness, I honor the Dhamma.
Imāya dhammānudhammapaṭipattiyā Saṃghaṃ pūjemi. [6.186]
By this practice of the Dhamma in its completeness, I honor the Sangha.
Addhā imāya paṭipattiyā jātijarābyādhimaraṇamhā parimuccissāmi. [7.618]
Indeed, by this practice, I shall be released from birth, aging, disease, and death.
Idaṃ me puññaṃ āsavakkhayā"vahaṃ hotu. [4.959]
May this merit of mine lead to the destruction of the taints (asavas).
Idaṃ me puññaṃ nibbānassa paccayo hotu. [4.831]
May this merit of mine be a condition for the attainment of Nibbāna.
Mama puññabhāgaṃ sabbasattānaṃ bhājemi; [5.112]
I share my portion of merit with all beings;
Te sabbe me samaṃ puññabhāgaṃ labhantu. [6.186]
May they all receive an equal share of my merit.
Sādhu Sādhu Sādhu [11.800]
Well said! Well said! Well said!`
}, 
		
    ];

 /* --- QUIZ SYSTEM VARIABLES --- */
let quizQueue = [];
let currentQuizIndex = 0;
let currentTargetLineIndex = -1; // The line originally clicked
let isSectionExam = false; // Flag to distinguish line test vs final exam

/* --- QUIZ GENERATION LOGIC --- */

// Helper to clean word for matching (strips punctuation)
/* --- HELPER: CLEAN WORD (LOWERCASE + NO PUNCTUATION) --- */
function cleanPaliWord(text) {
    if (!text) return "";
    return text.toLowerCase()
        // Remove standard and special punctuation common in Pali/Vietnamese texts
        .replace(/[.,:;!?'"“”‘’()\[\]{}...–-]/g, '') 
        .replace(/\s+/g, '') // Remove any accidental whitespace inside
        .trim();
}

/* --- 1. GENERATE QUIZ DATA --- */
function generateQuizData(lineIdx, hideRatio = 0.4) {
    const lineDiv = allLines[lineIdx];
    const wordSpans = Array.from(lineDiv.querySelectorAll('.word'));
    const allWords = wordSpans.map(span => span.innerText);
    
    // 1. Identify Valid Indices (Skip words that become empty after cleaning)
    const allValidIndices = allWords.map((w, i) => cleanPaliWord(w) ? i : -1).filter(i => i !== -1);
    
    // 2. Filter eligible indices: ONLY words longer than 2 characters
    let eligibleIndices = allValidIndices.filter(i => cleanPaliWord(allWords[i]).length > 2);
    
    // Fallback: If a sentence ONLY has short words (<= 2 chars), pick the longest one 
    // to ensure the quiz doesn't break by having 0 questions.
    if (eligibleIndices.length === 0 && allValidIndices.length > 0) {
        let longestIndex = allValidIndices[0];
        let maxLength = 0;
        allValidIndices.forEach(i => {
            const len = cleanPaliWord(allWords[i]).length;
            if (len > maxLength) {
                maxLength = len;
                longestIndex = i;
            }
        });
        eligibleIndices = [longestIndex];
    }

    // 3. Determine number of blanks based on the TOTAL valid words to maintain the 40% ratio
    let countToHide = Math.ceil(allValidIndices.length * hideRatio);
    if (countToHide < 1) countToHide = 1;
    
    // Cap it so we don't try to hide more words than we have eligible (> 2 chars)
    if (countToHide > eligibleIndices.length) countToHide = eligibleIndices.length;

    // 4. Randomly select indices to hide FROM ELIGIBLE INDICES ONLY
    const shuffledIndices = eligibleIndices.sort(() => 0.5 - Math.random());
    const hiddenIndices = shuffledIndices.slice(0, countToHide).sort((a, b) => a - b);
    
    // 5. Get Correct Words (CLEANED)
    const correctHiddenWords = hiddenIndices.map(i => cleanPaliWord(allWords[i]));
    
    // 6. Generate Distractors (CLEANED)
    const totalOptionsNeeded = hiddenIndices.length * 3;
    const distractorCount = totalOptionsNeeded - correctHiddenWords.length;
    
    const distractors = getDistractors(lineIdx, distractorCount);
    
    // 7. Create Word Bank (All Cleaned)
    let wordBank = [...correctHiddenWords, ...distractors];
    
    // Shuffle Word Bank
    wordBank = wordBank.sort(() => 0.5 - Math.random());

    return {
        lineIndex: lineIdx,
        originalWords: allWords,    // Keeps original formatting for the sentence display
        hiddenIndices: hiddenIndices,
        wordBank: wordBank,         // Contains only lowercase, clean words
        userAnswers: new Array(hiddenIndices.length).fill(null)
    };
}

/* --- 2. GET DISTRACTORS (CLEANED) --- */
function getDistractors(targetIdx, count) {
    let pool = [];
    
    // Define neighbors (2 before, 1 after)
    let neighbors = [];
    if (targetIdx === 0) {
        neighbors = [1, 2, 3];
    } else if (targetIdx === allLines.length - 1) {
        neighbors = [targetIdx - 3, targetIdx - 2, targetIdx - 1];
    } else {
        neighbors = [targetIdx - 2, targetIdx - 1, targetIdx + 1];
    }

    // Filter valid lines
    neighbors = neighbors.filter(i => i >= 0 && i < allLines.length && i !== targetIdx);

    // Helper to add words to pool
    const addToPool = (lineIndex) => {
        const spans = allLines[lineIndex].querySelectorAll('.word');
        spans.forEach(s => {
            const clean = cleanPaliWord(s.innerText);
            if (clean) pool.push(clean); // Push CLEANED word
        });
    };

    // 1. Try getting words from neighbors
    neighbors.forEach(nIdx => addToPool(nIdx));

    // 2. Fallback: If pool is too small (short section), grab from anywhere
    if (pool.length < count) {
        allLines.forEach((div, i) => {
            if (i !== targetIdx && !neighbors.includes(i)) {
                 addToPool(i);
            }
        });
    }

    // 3. Return unique random words to fill the count
    // Shuffle full pool first
    pool = pool.sort(() => 0.5 - Math.random());
    
    // Take unique slice
    return [...new Set(pool)].slice(0, count);
}

    let globalInterval = 3000; 
    let recitationTimeout = null;
    let currentRecitationLine = 0;
    let allLines = [];
    let currentSectionIndex = 0;
	let selectedLoopIndices = new Set();
    let isLoopActive = false;

function toggleLoopSentence() {
    isLoopActive = !isLoopActive;
    const btn = document.getElementById('btn-loop');
    const loopOne = document.getElementById('loop-count');

    if (isLoopActive) {
        btn.classList.add('active-loop');
        loopOne.style.display = 'block'; // Show the "1"
    } else {
        btn.classList.remove('active-loop');
        loopOne.style.display = 'none'; // Hide the "1"
    }
}
    // Khai báo các phần tử DOM
    const displayArea = document.getElementById('display-area');
    const titleArea = document.getElementById('section-title');
    const sectionSelect = document.getElementById('section-select');
    const audioPlayer = document.getElementById('audioPlayer');
    const recitationToggleBtn = document.getElementById('recitation-toggle-btn');
    const settingsPanel = document.getElementById('settings-panel');
    const helpButton = document.getElementById('help-toggle');
    const helpContainer = document.getElementById('help-container');
    const symbolInfo = '<i class="fas fa-circle-info"></i>'; // Information symbol
    const symbolClose = '<i class="fas fa-xmark"></i>'; // Close symbol

    function openHelpModal() {
    document.getElementById('help-modal').style.display = 'flex';
}

function closeHelpModal(event) {
    // 1. Check if the background overlay was clicked
    const isOverlay = event.target.id === 'help-modal';
    
    // 2. Check if the click was on (or inside) the close buttons
    const isCloseBtn = event.target.closest('.btn-close-help') || 
                       event.target.closest('.btn-bottom-close');

    if (isOverlay || isCloseBtn) {
        document.getElementById('help-modal').style.display = 'none';
    }
}
    /* --- GLOBAL VARIABLE FOR WORD COUNTING --- */
let sectionWordOffsets = [];

function calculateGlobalWordOffsets() {
    let runningTotal = 0;
    sectionWordOffsets = [];

    sections.forEach(section => {
        sectionWordOffsets.push(runningTotal); // Store the starting word index for this section
        
        // Calculate words in this section
        const lines = section.text.split('\n');
        let sectionWordCount = 0;
        
        lines.forEach(line => {
            let cleanLine = line.trim();
            if (cleanLine === '') return;
            
            // Identify Pali lines by time marker
            const timeMatch = cleanLine.match(/\s*\[(\d+(\.\d+)?)\]\s*$/);
            
            if (timeMatch) {
                // Remove time marker to get pure text
                const textContent = cleanLine.replace(timeMatch[0], '').trim();
                // Count words
                const words = textContent.split(/\s+/);
                const validWords = words.filter(w => w.trim() !== '');
                sectionWordCount += validWords.length;
            }
        });
        
        runningTotal += sectionWordCount;
    });
}
    function init() {
        
        // --- 1. TẢI CÀI ĐẶT GIAO DIỆN VÀ TỐC ĐỘ BAN ĐẦU ---
        const savedTheme = localStorage.getItem('themePreference');
        const body = document.body;
        const btn = document.querySelector('.btn-darkmode');

        if (savedTheme === 'dark') {
            body.setAttribute('data-theme', 'dark');
            if (btn) btn.innerHTML = '<i class="fas fa-sun-bright"></i>';
        } else {
             body.removeAttribute('data-theme');
             if (btn) btn.innerHTML = '<i class="fas fa-moon"></i>';
        }
        const savedDictState = localStorage.getItem('dictionaryEnabled');
        // If it is 'true' OR null (first time user), turn it ON
        if (savedDictState === 'true' || savedDictState === null) {
            isLookupEnabled = true;
            const dictBtn = document.getElementById('btn-dictionary');
            if (dictBtn) dictBtn.style.backgroundColor = "#d35400";
            // Wait slightly or call directly
            enablePaliLookup(); 
        } else {
            // Explicitly 'false'
            isLookupEnabled = false;
            // No need to set color, default is none
        }
		const savedEngState = localStorage.getItem('englishEnabled');
        const engBtn = document.getElementById('btn-english-toggle');
        // If it is 'true' OR null (first time user), turn it ON
        if (savedEngState === 'true' || savedEngState === null) {
            displayArea.classList.add('show-translation');
            if (engBtn) engBtn.classList.add('btn-english-active');
        } else {
            displayArea.classList.remove('show-translation');
            if (engBtn) engBtn.classList.remove('btn-english-active');
        }
        const savedInterval = localStorage.getItem('overrideInterval');
        const intervalInput = document.getElementById('recitation-interval');
        const speedControlArea = document.getElementById('speed-control-area');
        const btnShowSpeed = document.getElementById('btn-show-speed');

        if (savedInterval !== null) {
            const parsedInterval = parseFloat(savedInterval);
            globalInterval = parsedInterval * 1000; 
            intervalInput.value = parsedInterval.toFixed(1);
            document.getElementById('recitation-interval-label').innerText = parsedInterval.toFixed(1) + "s";
            
            speedControlArea.style.display = 'flex';
            btnShowSpeed.style.display = 'none';
        } else {
            globalInterval = 3000;
            intervalInput.value = 3;
            speedControlArea.style.display = 'none';
            btnShowSpeed.style.display = 'inline-block';
        }
calculateGlobalWordOffsets();
        // --- 2. SETUP PHẦN CÒN LẠI ---
        sections.forEach((sec, index) => {
            let option = document.createElement("option");
            option.value = index; option.text = sec.title;
            sectionSelect.appendChild(option);
        });
// BỔ SUNG: Xử lý đồng bộ khi người dùng tua (scrub) audio
        audioPlayer.addEventListener('seeked', () => {
            // Nếu đang trong chế độ Tuỳ chỉnh thời gian (Override Interval), không đồng bộ theo audio
            if (localStorage.getItem('overrideInterval')) return;

            // Chỉ chạy logic này khi đang trong chế độ Tụng Đọc
            if (displayArea.classList.contains('recitation-active')) {
                
                // 1. Tìm dòng văn bản mới tương ứng với thời gian audio hiện tại
                const newRecitationLine = findRecitationLine(audioPlayer.currentTime);
                
                // 2. Nếu dòng mới khác dòng cũ, tiến hành đồng bộ
                if (newRecitationLine !== currentRecitationLine) {
                    currentRecitationLine = newRecitationLine;
                    showRecitationLine(currentRecitationLine);
                }
                
                // 3. Xóa timer cũ và tạo timer mới (dựa trên thời gian còn lại của dòng mới)
                if (!audioPlayer.paused) {
                    // Khi audio đang chạy, runRecitationStep sẽ tự tính toán thời gian còn lại
                    // của dòng mới và đặt timer chính xác.
                    runRecitationStep();
                } else {
                    // Nếu audio đang dừng, chỉ cần xóa timer cũ và cập nhật visuals
                    if (recitationTimeout) {
                        clearTimeout(recitationTimeout);
                        recitationTimeout = null;
                    }
                    updateButtonVisuals('manual');
                }
            }
        });        

audioPlayer.addEventListener('play', () => {
    
    if (displayArea.classList.contains('recitation-active') && !recitationTimeout) {
        runRecitationStep();
    }
});
        
// CẬP NHẬT MỚI: Chỉ dừng timer nếu user bấm pause, không dừng nếu audio tự hết
        audioPlayer.addEventListener('pause', () => {
            // Chỉ chạy logic này khi đang trong chế độ Tụng Đọc
            if (displayArea.classList.contains('recitation-active')) {
                
                // Nếu audio dừng vì đã hết bài (ended), THOÁT NGAY.
                if (audioPlayer.ended) return; 

                // Nếu audio dừng do người dùng bấm pause (dù là nút Recitation hay nút Audio Player)
                if(recitationTimeout) {
                    clearTimeout(recitationTimeout); 
                    recitationTimeout = null;
                }
                updateButtonVisuals('manual');
            }
        });
// Listen for volume changes
audioPlayer.addEventListener('volumechange', () => {
    // Save the current volume (0.0 to 1.0) to localStorage
    localStorage.setItem('savedAudioVolume', audioPlayer.volume);
});
        audioPlayer.addEventListener('ended', () => {
    // If Loop is active and we are in Recitation Mode, 
    // DO NOT reset to 0. Let runRecitationStep handle the loop jump.
    if (isLoopActive && displayArea.classList.contains('recitation-active')) {
        return; 
    }
    
});
        // -------------------------
        let initialIndex = 0;
        const savedIndex = localStorage.getItem('lastSectionIndex');
        if (savedIndex !== null) {
            const parsedIndex = parseInt(savedIndex);
            if (parsedIndex >= 0 && parsedIndex < sections.length) {
                initialIndex = parsedIndex;
            }
        }
        
        loadSection(initialIndex);
    }

/* --- INFO MODAL LOGIC --- */
function showSectionInfo() {
    const currentSection = sections[currentSectionIndex];
    const infoContent = sectionInfoData[currentSection.id];
    
    if (infoContent) {
        // Default Title
        let displayTitle = "Protective Verses (Paritta)";
        
  
        
        document.getElementById('simple-modal-title').innerText = displayTitle;
        document.getElementById('simple-modal-body').innerHTML = infoContent;
        document.getElementById('simple-info-modal').style.display = 'flex';
    }
}

function closeSimpleInfoModal() {
    document.getElementById('simple-info-modal').style.display = 'none';
}

function loadSection(index) {
    // 1. Check if Recitation Mode is CURRENTLY active
    const wasRecitationActive = document.body.classList.contains('recitation-active-mode');

    // 2. Stop audio if playing
    if (!audioPlayer.paused) audioPlayer.pause();
    
    // 3. Handle Index wrapping
    if (index < 0) index = sections.length - 1;
    if (index >= sections.length) index = 0;
    currentSectionIndex = index;
    
    // 4. Save preference
    localStorage.setItem('lastSectionIndex', index);
    selectedLoopIndices.clear();
    // 5. Update UI Basics
    sectionSelect.value = index;
    titleArea.innerText = sections[index].title;
	const infoIcon = document.getElementById('btn-section-info');
    if (sectionInfoData[sections[index].id]) {
        infoIcon.style.display = 'block';
    } else {
        infoIcon.style.display = 'none';
    }
	const vnTitleEl = document.getElementById('section-title-vn');
    if (vnTitleEl) {
        vnTitleEl.innerText = sections[index].title_vn || ""; // Fallback to empty if missing
    }
    audioPlayer.src = 'audio2/' + sections[index].audio; // Ensure path is correct ('audio/' or './audio/')
    
    // 6. Render the Text (This populates allLines)
    renderText(sections[index].text);

   isLoopActive = false;
        document.getElementById('btn-loop').classList.remove('active-loop');
		
		 updateOverallStats(); 
    if (wasRecitationActive) {
        // If mode was on, RESTART it for the new section immediately.
        // We do NOT call exitRecitation().
        
        // a. Re-initialize dashboard for new section
        startRecitationMode(); 
        
        // b. Reset audio position to 0
        audioPlayer.currentTime = 0;
        
        // c. Ensure visuals are set to "Manual" (Paused) start
        updateButtonVisuals('manual');
    } else {
        // If mode was off, ensure we clean up any remnants
        exitRecitation();
    }
}

    function selectSection() { loadSection(parseInt(sectionSelect.value)); }
    function changeSection(d) { loadSection(currentSectionIndex + d); }
// --- RANDOM FUNCTION ---
    function randomSection() {
        // Generate a random index between 0 and the last index of sections array
        const randomIndex = Math.floor(Math.random() * sections.length);
        
        // Load the section
        loadSection(randomIndex);
        
        // Optional: Scroll to top to ensure user sees the new title
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
/* --- NEW RENDER LOGIC --- */
function renderText(rawText) {
    displayArea.innerHTML = '';
    allLines = []; 
    
    // Get the starting Global Index for the current section
    let currentGlobalIndex = sectionWordOffsets[currentSectionIndex] || 0;

    const lines = rawText.split('\n');
    
    let cumulativeStartTimeMs = 0;
    const overrideIntervalMs = localStorage.getItem('overrideInterval') ? parseFloat(localStorage.getItem('overrideInterval')) * 1000 : null;

    lines.forEach(line => {
        let cleanLine = line.trim();
        if (cleanLine === '') return;

        const timeMatch = cleanLine.match(/\s*\[(\d+(\.\d+)?)\]\s*$/);

        if (timeMatch) {
            // === IS PALI LINE ===
            let customDuration = parseFloat(timeMatch[1]) * 1000;
            cleanLine = cleanLine.replace(timeMatch[0], ''); 

            const lineDiv = document.createElement('div');
            lineDiv.className = 'line-break';
            
            let currentLineDuration; 
            if (overrideIntervalMs !== null) {
                currentLineDuration = overrideIntervalMs;
                lineDiv.dataset.hasCustomTime = "false";
            } else {
                currentLineDuration = customDuration || 3000;
                lineDiv.dataset.hasCustomTime = "true";
            }

            lineDiv.dataset.startTime = cumulativeStartTimeMs / 1000;
            lineDiv.dataset.duration = currentLineDuration;

            cumulativeStartTimeMs += currentLineDuration;

            // Create clickable words for Pali
            cleanLine.split(/\s+/).forEach(wordStr => {
                if (wordStr.trim() === '') return;
                const span = document.createElement('span');
                span.className = 'word';
                span.innerText = wordStr;
                
                // --- NEW: Assign Global Index ---
                span.dataset.globalIndex = currentGlobalIndex++;
                // --------------------------------

                span.onclick = function() {
                    if (this.classList.contains('hidden')) {
                        this.classList.remove('hidden');
                        this.classList.add('revealed');
                    }
                };
                lineDiv.appendChild(span);
            });

            displayArea.appendChild(lineDiv);
            allLines.push(lineDiv); 

        } else {
            // === IS TRANSLATION LINE ===
            const transDiv = document.createElement('div');
            transDiv.className = 'translation-line';
            transDiv.innerText = cleanLine;
            displayArea.appendChild(transDiv);
        }
    });
}

// specific setup function or inside window.onload
function initAudioPlayer() {
    const savedVolume = localStorage.getItem('savedAudioVolume');
    
    if (savedVolume !== null) {
        // Convert the string back to a float and apply it
        audioPlayer.volume = parseFloat(savedVolume);
    } else {
        // Optional: Set a default if nothing is saved (e.g., 50%)
        audioPlayer.volume = 0.5; 
    }
}

// Call this when the app starts
initAudioPlayer();

function toggleEnglish() {
    displayArea.classList.toggle('show-translation');
    const btn = document.getElementById('btn-english-toggle');
    const isEnabled = displayArea.classList.contains('show-translation');
    
    if (isEnabled) {
        btn.classList.add('btn-english-active');
    } else {
        btn.classList.remove('btn-english-active');
    }

    // Save state to LocalStorage
    localStorage.setItem('englishEnabled', isEnabled);
}

    function updateButtonVisuals(state) {
        recitationToggleBtn.classList.remove('active-auto', 'active-manual');
        if (state === 'auto') {
            recitationToggleBtn.classList.add('active-auto'); recitationToggleBtn.innerHTML = '<i class="fas fa-pause"></i>';
        } else if (state === 'manual') {
            recitationToggleBtn.classList.add('active-manual'); recitationToggleBtn.innerHTML = '<i class="fas fa-play"></i>';
        } else {
            recitationToggleBtn.innerHTML = '<i class="fas fa-microphone"></i>';
        }
    }

/* =========================================
   MEMORIZATION DASHBOARD LOGIC
   ========================================= */

// Create a unique key for local storage: score_SectionID_LineIndex
function getScoreKey(lineIdx) {
    const sectionId = sections[currentSectionIndex].id;
    return `memo_score_${sectionId}_${lineIdx}`;
}

function getLineScore(lineIdx) {
    const val = localStorage.getItem(getScoreKey(lineIdx));
    return val ? parseInt(val) : 0;
}

function saveLineScore(lineIdx, score) {
    localStorage.setItem(getScoreKey(lineIdx), score);
    updateDashboardBox(lineIdx, score);
    updateOverallStats();
}

// Render the grid of boxes
// --- UPDATED DASHBOARD LOGIC WITH LONG PRESS ---

function renderDashboard() {
    const grid = document.getElementById('dashboard-grid');
    grid.innerHTML = ''; // Clear old

    allLines.forEach((line, idx) => {
        const score = getLineScore(idx);
        const box = document.createElement('div');
        
        // Add heatmap class
        box.className = `progress-box ${getHeatmapClass(score)}`;
        
        // Restore selection state if re-rendering
        if (selectedLoopIndices.has(idx)) {
            box.classList.add('multi-loop-selected');
        }

        box.innerText = idx + 1;
        box.id = `box-${idx}`;
        
        // ATTACH LONG PRESS EVENTS
        attachBoxEvents(box, idx);

        grid.appendChild(box);
    });

    updateOverallStats();
}

function attachBoxEvents(box, idx) {
    let longPressTimer;
    let isLongPress = false;

    const startPress = (e) => {
        isLongPress = false;
        longPressTimer = setTimeout(() => {
            isLongPress = true;
            toggleBoxSelection(idx);
            // Optional: Vibrate mobile device for feedback
            if (navigator.vibrate) navigator.vibrate(50);
        }, 400); // 500ms threshold for long press
    };

    const cancelPress = () => {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }
    };

    // Mouse Events
    box.addEventListener('mousedown', startPress);
    box.addEventListener('mouseup', cancelPress);
    box.addEventListener('mouseleave', cancelPress);

    // Touch Events
    box.addEventListener('touchstart', (e) => {
        // We do not preventDefault here to allow scrolling
        startPress(e);
    }, { passive: true });
    
    box.addEventListener('touchend', cancelPress);
    box.addEventListener('touchmove', cancelPress);

    // Click Event (Standard Jump)
    box.onclick = function(e) {
        // If it was a long press, ignore the click (don't jump)
        if (isLongPress) {
            e.stopPropagation();
            return;
        }
        jumpToLine(idx);
    };
}

function toggleBoxSelection(idx) {
    const box = document.getElementById(`box-${idx}`);
    if (selectedLoopIndices.has(idx)) {
        selectedLoopIndices.delete(idx);
        box.classList.remove('multi-loop-selected');
    } else {
        selectedLoopIndices.add(idx);
        box.classList.add('multi-loop-selected');
    }
}
// Determine color class based on score
function getHeatmapClass(score) {
    if (score === 0) return 'heatmap-0';
    if (score <= 25) return 'heatmap-1';
    if (score <= 50) return 'heatmap-2';
    if (score <= 75) return 'heatmap-3';
    return 'heatmap-4';
}

function updateDashboardBox(idx, score) {
    const box = document.getElementById(`box-${idx}`);
    if (box) {
        // Remove old heatmap classes
        box.classList.remove('heatmap-0', 'heatmap-1', 'heatmap-2', 'heatmap-3', 'heatmap-4');
        // Add new
        box.classList.add(getHeatmapClass(score));
    }
}
/* --- UPDATED XP SYSTEM --- */
function getSectionXP(sectionId) {
    const xp = localStorage.getItem(`section_xp_${sectionId}`);
    return xp ? parseInt(xp) : 0;
}

function addSectionXP(sectionId, amount) {
    // 1. Add to Section Total (Existing logic)
    const currentXP = getSectionXP(sectionId);
    localStorage.setItem(`section_xp_${sectionId}`, currentXP + amount);
    
    // NEW: Track the last active timestamp for this section to limit chart legends
    localStorage.setItem(`section_last_active_${sectionId}`, Date.now());
    
    const d = new Date();
    const offset = d.getTimezoneOffset() * 60000;
    const today = new Date(d.getTime() - offset).toISOString().split('T')[0];
    const dailyKey = `daily_xp_log_${today}`;
    const currentDaily = parseInt(localStorage.getItem(dailyKey) || 0);
    localStorage.setItem(dailyKey, currentDaily + amount);

    // 3. NEW: Add to Daily Section XP Log (For stacked charts)
    const dailySectionKey = `daily_section_xp_${sectionId}_${today}`;
    const currentDailySection = parseInt(localStorage.getItem(dailySectionKey) || 0);
    localStorage.setItem(dailySectionKey, currentDailySection + amount);
}

function getLevelInfo(xp) {
    // Calculate level: Starts at 1, adds 1 level for every 100 XP
    const level = Math.floor(xp / 100) + 1;
    let iconStr = "";

    if (level === 1) {
        iconStr = '<i class="fas fa-award-simple"></i>';
    } else if (level === 2) {
        iconStr = '<i class="fas fa-award"></i>';
    } else if (level === 3) {
        iconStr = '<i class="far fa-award-simple"></i>';
    } else if (level === 4) {
        iconStr = '<i class="far fa-award"></i>';
    } else {
        // Level 5 and up: Logic for Trophies
        // Level 5 = 1 trophy, Level 6 = 2 trophies, Level 7+ = 3 trophies
        let trophyCount = level - 4; 
        
        // Cap the trophies at 3
        if (trophyCount > 3) trophyCount = 3;

        // Generate the icons
        for (let i = 0; i < trophyCount; i++) {
            iconStr += '<i class="fas fa-trophy-star"></i>';
        }
    }

    return { level: level, icon: iconStr };
}

/* --- DAILY GOAL LOGIC --- */

function getDailyGoal() {
    return parseInt(localStorage.getItem('daily_xp_goal') || 100);
}

function getDailyXP() {
    const d = new Date();
    const offset = d.getTimezoneOffset() * 60000;
    const today = new Date(d.getTime() - offset).toISOString().split('T')[0];
    return parseInt(localStorage.getItem(`daily_xp_log_${today}`) || 0);
}

function editDailyGoal() {
    const currentGoal = getDailyGoal();
    const newGoal = prompt("Enter your daily goal:", currentGoal);
    
    if (newGoal !== null && !isNaN(newGoal) && newGoal > 0) {
        localStorage.setItem('daily_xp_goal', parseInt(newGoal));
        updateOverallStats(); // Refresh UI
    }
}
function updateOverallStats() {
    const dailyXP = getDailyXP();
    const dailyGoal = getDailyGoal();
    let dailyPct = Math.round((dailyXP / dailyGoal) * 100);
    
    // Cap visual width at 100% even if overachieved
    const visualWidth = dailyPct > 100 ? 100 : dailyPct;
    
    document.getElementById('bar-daily').style.width = visualWidth + '%';
    
    // Change color if goal reached
    if (dailyPct >= 100) {
        document.getElementById('bar-daily').style.backgroundColor = '#8e44ad'; // Purple for completion
    } else {
        document.getElementById('bar-daily').style.backgroundColor = '#e67e22'; // Orange default
    }

    // Update Text with Icon
    const penIcon = '<i class="fas fa-pen" onclick="editDailyGoal()" style="cursor: pointer; margin-left: 5px; font-size: 10px; opacity: 0.7;"></i>';
    document.getElementById('text-daily').innerHTML = `${dailyXP}/${dailyGoal} XP ${penIcon}`;
    let sessionTotalScore = 0;
    let sessionMaxScore = allLines.length * 100;
    allLines.forEach((_, idx) => {
        const s = getLineScore(idx);
        sessionTotalScore += s;
    });
    const sessionPct = sessionMaxScore === 0 ? 0 : Math.round((sessionTotalScore / sessionMaxScore) * 100);
    const globalStats = calculateGlobalStats();
    const globalPct = globalStats.maxScore === 0 ? 0 : Math.round((globalStats.currentScore / globalStats.maxScore) * 100);

    // Update Bars
    document.getElementById('bar-session').style.width = sessionPct + '%';
    document.getElementById('text-session').innerText = sessionPct + '%';
    document.getElementById('bar-total').style.width = globalPct + '%';
    document.getElementById('text-total').innerText = globalPct + '%';

    // --- LOGIC FOR SECTION EXAM BUTTON & BANNER ---
    
    // Check if user has ALREADY passed this section's final exam
    const sectionPassedKey = `section_passed_${sections[currentSectionIndex].id}`;
    const hasPassedSection = localStorage.getItem(sectionPassedKey) === 'true';
    const isRecitationActive = document.getElementById('display-area').classList.contains('recitation-active');
    const banner = document.getElementById('section-achievement-banner');
    let examContainer = document.getElementById('final-exam-container');

    // Helper to ensure exam button is visible and set text
    const showExamButton = (title, desc, btnText) => {
        if (!examContainer) {
            injectExamButton();
            examContainer = document.getElementById('final-exam-container');
        }
        examContainer.style.display = 'block';
        
        // Update text if elements exist
        const t = document.getElementById('exam-title');
        const d = document.getElementById('exam-desc');
        const b = document.getElementById('exam-btn');
        if (t) t.innerText = title;
        if (d) d.innerHTML = desc;
        if (b) b.innerText = btnText;
    };

    // LOGIC:
    // 1. If 100% Memorized (regardless of pass status), show the Exam Button
    if (hasPassedSection) {
        // SCENARIO: ALREADY PASSED
        
        // 1. Always show the banner
        banner.style.display = 'block';
        
        // 2. Only show "Retake" button if inside Recitation Mode
        if (isRecitationActive) {
            const currentSectionId = sections[currentSectionIndex].id;
            const currentXP = getSectionXP(currentSectionId);
            const levelInfo = getLevelInfo(currentXP);
            
            showExamButton(
                "Review & Test", 
                `${levelInfo.icon} Proficiency: Level ${levelInfo.level} (${currentXP} XP)`, 
                "Review Again"
            );
        } else {
            // If viewing normal text, hide the exam button to keep it clean
            if (examContainer) examContainer.style.display = 'none';
        }

    } else {
        // SCENARIO: NOT PASSED YET
        banner.style.display = 'none';

        if (sessionPct === 100) {
            // If 100% memorized but not passed: Always show button (Normal & Recitation)
            showExamButton(
                "Congratulations! You've mastered 100% of the lines!", 
            "Pass the final assessment to earn your Certification.", 
            "Start Test"
            );
        } else {
            // Not 100% yet
            if (examContainer) examContainer.style.display = 'none';
        }
    }

    // --- BANNER CONTENT UPDATE (If Visible) ---
    if (banner.style.display === 'block') {
        const bannerTitle = banner.querySelector('h3');
        const bannerSubtitle = banner.querySelector('div');

        if (globalPct === 100) {
            bannerTitle.innerHTML = '<i class="fas fa-wreath-laurel"></i> Dhammadhara <i class="fas fa-wreath-laurel"></i>';
            bannerSubtitle.innerHTML = 'Certification of Achievement: Full&nbsp;Memorization&nbsp;of&nbsp;the&nbsp;Paritta';
             showGrandAchievement();
        } else {
            bannerTitle.innerHTML = '<i class="fas fa-wreath-laurel"></i> Sutadhara <i class="fas fa-wreath-laurel"></i>';
            bannerSubtitle.innerHTML = 'Certification of Achievement in&nbsp;Memorizing&nbsp;this&nbsp;Sutta';
        }
    }
}

/* --- HỆ THỐNG BIỂU ĐỒ (Dựa trên renderreport.js) --- */

let statsCharts = {
    section: null,
    weekly: null,
    monthly: null
};

// State variables for navigating dates
let statsCurrentWeekStart = null;
let statsCurrentMonth = null;

function openStatsModal() {
    document.getElementById('stats-modal').style.display = 'flex';
    // Khởi tạo/Reset lại UI khi mở (Render mặc định "Tuần này")
    setTimeout(() => renderStatsCharts(true), 100); 
}

function closeStatsModal() {
    document.getElementById('stats-modal').style.display = 'none';
}

function changeStatsWeek(offset) {
    if(!statsCurrentWeekStart) return;
    statsCurrentWeekStart.setDate(statsCurrentWeekStart.getDate() + (offset * 7));
    renderStatsCharts();
}

function changeStatsMonth(offset) {
    if(!statsCurrentMonth) return;
    statsCurrentMonth.setMonth(statsCurrentMonth.getMonth() + offset);
    renderStatsCharts();
}
/* --- HÀM RENDER LỊCH TU TẬP DỰA TRÊN XP --- */
function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    if (!grid) return;
    grid.innerHTML = '';
    
    // Sử dụng biến statsCurrentMonth có sẵn trong hệ thống Chart
    const y = statsCurrentMonth.getFullYear(); 
    const m = statsCurrentMonth.getMonth();
    
    document.getElementById('cal-month-year').innerText = new Date(y, m).toLocaleString('en-GB', { month: 'long', year: 'numeric' });

    const headerDiv = document.createElement('div');
    headerDiv.className = 'calendar-header';
    ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].forEach(d => {
        const h = document.createElement('div'); 
        h.className = 'cal-head-day'; 
        h.innerText = d;
        grid.appendChild(h);
    });

    const firstDayRaw = new Date(y, m, 1).getDay();
    // Chuyển Chủ nhật (0) thành vị trí cuối cùng trong tuần (6)
    const blankSlots = firstDayRaw === 0 ? 6 : firstDayRaw - 1;
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    
    for(let i=0; i<blankSlots; i++) { 
        grid.appendChild(document.createElement('div')); 
    }
    
    for(let i=1; i<=daysInMonth; i++) {
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day'; 
        dayEl.innerText = i;
        
        // Đồng bộ chuẩn cách tạo chuỗi ngày với cách App đang lưu (tránh lệch múi giờ UTC)
        const d = new Date(y, m, i);
        const offset = d.getTimezoneOffset() * 60000;
        const dStr = new Date(d.getTime() - offset).toISOString().split('T')[0];
        
      // ---> GẮN SỰ KIỆN ONCLICK ĐỂ MỞ BẢNG CHI TIẾT NGÀY <---
            const formattedDate = `${String(i).padStart(2, '0')}/${String(m + 1).padStart(2, '0')}/${y}`;
            dayEl.onclick = () => openDailyStatsModal(dStr, formattedDate);
        const totalXP = parseInt(localStorage.getItem(`daily_xp_log_${dStr}`) || 0);

        if(totalXP > 0) {
            dayEl.classList.add('has-data');
            // Hiển thị tooltip lượng XP khi di chuột vào ô
            dayEl.title = `${totalXP} XP`;

            // Mức độ Level quy đổi theo điểm XP
             if (totalXP >= 250) dayEl.classList.add('level-8');      
            else if (totalXP >= 200) dayEl.classList.add('level-7'); 
            else if (totalXP >= 150) dayEl.classList.add('level-6'); 
            else if (totalXP >= 120) dayEl.classList.add('level-5'); 
            else if (totalXP >= 90) dayEl.classList.add('level-4');  
            else if (totalXP >= 60) dayEl.classList.add('level-3');  
            else if (totalXP >= 30) dayEl.classList.add('level-2');  
            else dayEl.classList.add('level-1');                 
            
            
        }

        grid.appendChild(dayEl);
    }
}
function renderStatsCharts(resetDates = false) {
    if (typeof Chart === 'undefined') {
        alert("Loading chart library...");
        return;
    }

    const rangeSelect = document.getElementById('report-range-select');
    const rangeMode = rangeSelect ? rangeSelect.value : 'all';

    const now = new Date();
    const realCurrentDay = now.getDay() || 7; // 1-7 (Mon-Sun)
    const realThisWeekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - realCurrentDay + 1);
    const realThisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Handle Reset / Adjust Dates
    if (resetDates || !statsCurrentWeekStart || !statsCurrentMonth) {
        if (rangeMode === 'last_week') {
            statsCurrentWeekStart = new Date(realThisWeekStart);
            statsCurrentWeekStart.setDate(statsCurrentWeekStart.getDate() - 7);
            statsCurrentMonth = new Date(statsCurrentWeekStart.getFullYear(), statsCurrentWeekStart.getMonth(), 1);
        } else if (rangeMode === 'last_month') {
            statsCurrentMonth = new Date(realThisMonthStart);
            statsCurrentMonth.setMonth(statsCurrentMonth.getMonth() - 1);
            statsCurrentWeekStart = new Date(statsCurrentMonth.getFullYear(), statsCurrentMonth.getMonth(), 1);
            const day = statsCurrentWeekStart.getDay() || 7;
            statsCurrentWeekStart.setDate(statsCurrentWeekStart.getDate() - day + 1);
        } else {
            statsCurrentWeekStart = new Date(realThisWeekStart);
            statsCurrentMonth = new Date(realThisMonthStart);
        }
    }

    // --- CHART CONFIGURATION ---
    const commonOptions = {
        maintainAspectRatio: false,
        scales: {
            x: { stacked: true, grid: { color: '#374151' }, ticks: { color: '#9ca3af', font: { size: 11 } } },
            y: {
                stacked: true,
                grid: { color: '#374151' },
                title: { display: false },
                ticks: { precision:0, color: '#9ca3af', font: { size: 11 } }
            }
        },
        plugins: {
            legend: { display: false, labels: { color: '#9ca3af', font: { size: 11 } } },
            tooltip: {
                backgroundColor: '#121821', titleColor: '#f3f4f6', bodyColor: '#f3f4f6', borderColor: '#374151', borderWidth: 1, padding: 10, z: 999,
                callbacks: {
                    label: function(context) {
                        let label = context.dataset.label || '';
                        let value = context.raw || 0;
                        let total = 0;
                        
                        // Calculate the total of the stack for percentage
                        context.chart.data.datasets.forEach((dataset, i) => {
                            if (context.chart.isDatasetVisible(i)) {
                                total += dataset.data[context.dataIndex] || 0;
                            }
                        });

                        let percentage = total > 0 ? ((value / total) * 100).toFixed(0) : 0;
                        return `${label}: ${value} XP (${percentage}%)`;
                    }
                }
            }
        }
    };

    // --- DATA PREPARATION ---
    const bgColors = [
    // 1-10: Nhóm màu rực rỡ (Vibrant)
    '#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', 
    '#e67e22', '#1abc9c', '#e84393', '#f39c12', '#d35400',
    
    // 11-20: Nhóm màu Pastel sáng (Light/Pastel)
    '#55efc4', '#81ecec', '#74b9ff', '#a29bfe', '#ffeaa7', 
    '#fab1a0', '#ff7675', '#fd79a8', '#badc58', '#dff9fb',
    
    // 21-30: Nhóm màu đậm/trầm (Deep/Dark)
    '#c0392b', '#2980b9', '#27ae60', '#f39c12', '#8e44ad', 
    '#d35400', '#16a085', '#2c3e50', '#192a56', '#441d49',
    
    // 31-40: Nhóm màu Neon và kẹo ngọt (Candy/Neon)
    '#00cec9', '#0984e3', '#6c5ce7', '#ff85a2', '#4cd137', 
    '#fbc531', '#487eb0', '#e056fd', '#ffbe76', '#ff7979',
    
    // 41-50: Nhóm màu trung tính và Earth tones (Earthy)
    '#95afc0', '#22a6b3', '#be2edd', '#4834d4', '#130f40', 
    '#6ab04c', '#f9ca24', '#eb4d4b', '#7ed6df', '#5758bb'
];

   // 1. Doughnut Chart Data (Overall)
    const sectionLabels = [];
    const sectionData = [];
	const doughnutColors = [];
    let totalXP = 0;
    
    // NEW: Array to track activity for legend filtering
    const sectionActivity = [];
    
    // Array to hold dataset structures for Bar Charts
    let weeklyDatasets = [];
    let monthlyDatasets = [];
    const daysInMonth = new Date(statsCurrentMonth.getFullYear(), statsCurrentMonth.getMonth() + 1, 0).getDate();

    sections.forEach((sec, idx) => {
        let color = bgColors[idx % bgColors.length];
        
        // Setup Doughnut Data
        const xp = getSectionXP(sec.id);
        if (xp > 0) {
            sectionLabels.push(sec.title);
            sectionData.push(xp);
			doughnutColors.push(color);
            totalXP += xp;
            
            // NEW: Record last active time for this section
            const lastActive = parseInt(localStorage.getItem(`section_last_active_${sec.id}`) || 0);
            sectionActivity.push({ title: sec.title, lastActive: lastActive });
        }

        // Setup base structures for Stacked Bar charts
        weeklyDatasets.push({
            label: sec.title,
            data: new Array(7).fill(0),
            backgroundColor: color,
            stack: '0',
            _sumWeek: 0
        });
        
        monthlyDatasets.push({
            label: sec.title,
            data: new Array(daysInMonth).fill(0),
            backgroundColor: color,
            stack: '0',
            _sumMonth: 0
        });
    });

    // 2. Weekly Chart Data Population
    const weekStartMs = statsCurrentWeekStart.getTime();
    const weekEndMs = weekStartMs + (7 * 24 * 60 * 60 * 1000);
    const weekEndDisp = new Date(weekEndMs - 1);
    document.getElementById('weekly-report-title').innerText = `Week (${statsCurrentWeekStart.toLocaleDateString('en-GB', {month:'numeric', day:'numeric'})} - ${weekEndDisp.toLocaleDateString('en-GB', {month:'numeric', day:'numeric'})})`;

    const weeklyLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    for (let i = 0; i < 7; i++) {
        const d = new Date(statsCurrentWeekStart);
        d.setDate(d.getDate() + i);
        const offset = d.getTimezoneOffset() * 60000;
        const dateStr = new Date(d.getTime() - offset).toISOString().split('T')[0];
        
        sections.forEach((sec, sIdx) => {
            const val = parseInt(localStorage.getItem(`daily_section_xp_${sec.id}_${dateStr}`) || 0);
            weeklyDatasets[sIdx].data[i] = val;
            weeklyDatasets[sIdx]._sumWeek += val;
        });
    }

    // 3. Monthly Chart Data Population
    const mYear = statsCurrentMonth.getFullYear();
    const mMonth = statsCurrentMonth.getMonth();
    document.getElementById('monthly-report-title').innerText = `Month ${new Date(mYear, mMonth).toLocaleDateString('en-GB', { month: 'numeric', year: 'numeric' })}`;
    const monthlyLabels = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    for (let i = 1; i <= daysInMonth; i++) {
        const d = new Date(mYear, mMonth, i);
        const offset = d.getTimezoneOffset() * 60000;
        const dateStr = new Date(d.getTime() - offset).toISOString().split('T')[0];
        
        sections.forEach((sec, sIdx) => {
            const val = parseInt(localStorage.getItem(`daily_section_xp_${sec.id}_${dateStr}`) || 0);
            monthlyDatasets[sIdx].data[i-1] = val;
            monthlyDatasets[sIdx]._sumMonth += val;
        });
    }

    // Filter out datasets that have 0 XP for the selected period to keep the legend clean
    weeklyDatasets = weeklyDatasets.filter(ds => ds._sumWeek > 0);
    monthlyDatasets = monthlyDatasets.filter(ds => ds._sumMonth > 0);

    // --- DRAW CHARTS ---

    // Doughnut Chart
    const ctxSection = document.getElementById('sectionXPChart').getContext('2d');
    if (statsCharts.section) statsCharts.section.destroy();
// NEW: Determine Top 5 Most Recent Titles
    sectionActivity.sort((a, b) => b.lastActive - a.lastActive);
    const top5Titles = sectionActivity.slice(0, 5).map(s => s.title);
    const centerTextPlugin = {
        id: 'centerText',
        afterDatasetsDraw: function(chart) {
            const { ctx, chartArea: { top, bottom, left, right } } = chart;
            ctx.save();
            const centerX = (left + right) / 2;
            const centerY = (top + bottom) / 2;
            const chartHeight = bottom - top;
            const fontSizeMain = chartHeight / 10; 
            const fontSizeSub = chartHeight / 20;

            ctx.textAlign = "center"; ctx.textBaseline = "middle";
            ctx.font = `bold ${fontSizeMain}px sans-serif`;
            ctx.fillStyle = "#FFFFFF"; 
            ctx.fillText(totalXP.toLocaleString(), centerX, centerY - (fontSizeMain * 0.15));
            ctx.font = `normal ${fontSizeSub}px sans-serif`;
            ctx.fillStyle = "#9ca3af";
            ctx.fillText("XP", centerX, centerY + (fontSizeMain * 0.75));
            ctx.restore();
        }
    };

    statsCharts.section = new Chart(ctxSection, {
        type: 'doughnut',
        data: {
            labels: sectionLabels,
            datasets: [{ data: sectionData, backgroundColor: doughnutColors, borderWidth: 1, borderColor: '#1f2937' }]
        },
        options: {
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { 
                        color: '#9ca3af',
                        // NEW: Filter to show only the top 5 recent legends
                        filter: function(item, chart) {
                            return top5Titles.includes(item.text);
				}}, position: 'bottom' },
                title: { display: sectionData.length === 0, text: 'No data available', position: 'bottom', color: '#6b7280' },
                tooltip: {
                    backgroundColor: '#121821', titleColor: '#f3f4f6', bodyColor: '#f3f4f6', borderColor: '#374151', borderWidth: 1, padding: 10,
                    callbacks: {
                        label: function(context) {
                            let value = context.raw;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(0) : 0;
                            return ` ${value} XP (${percentage}%)`;
                        }
                    }
                }
            }
        },
        plugins: [centerTextPlugin]
    });

    // Weekly Stacked Bar Chart
    const ctxWeekly = document.getElementById('weeklyXPChart').getContext('2d');
    if (statsCharts.weekly) statsCharts.weekly.destroy();

    statsCharts.weekly = new Chart(ctxWeekly, {
        type: 'bar',
        data: {
            labels: weeklyLabels,
            datasets: weeklyDatasets.length > 0 ? weeklyDatasets : [{ label: 'No data available', data: new Array(7).fill(0), backgroundColor: '#374151' }]
        },
        options: {
            ...commonOptions,
            plugins: {
                ...commonOptions.plugins,
                tooltip: {
                    ...commonOptions.plugins.tooltip,
                    callbacks: {
                        ...commonOptions.plugins.tooltip.callbacks,
                        title: (context) => {
                            const index = context[0].dataIndex;
                            const date = new Date(statsCurrentWeekStart);
                            date.setDate(date.getDate() + index);
                            
                            return `${context[0].label} (${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')})`;
                        }
                    }
                }
            }
        }
    });

    // Monthly Stacked Bar Chart
    const ctxMonthly = document.getElementById('monthlyXPChart').getContext('2d');
    if (statsCharts.monthly) statsCharts.monthly.destroy();

    statsCharts.monthly = new Chart(ctxMonthly, {
        type: 'bar',
        data: {
            labels: monthlyLabels,
            datasets: monthlyDatasets.length > 0 ? monthlyDatasets : [{ label: 'No data available', data: new Array(daysInMonth).fill(0), backgroundColor: '#374151' }]
        },
        options: {
            ...commonOptions,
            plugins: {
                ...commonOptions.plugins,
                tooltip: {
                    ...commonOptions.plugins.tooltip,
                    callbacks: {
                        ...commonOptions.plugins.tooltip.callbacks,
                        title: (context) => `${String(context[0].label).padStart(2, '0')}/${String(mMonth + 1).padStart(2, '0')}`
                    }
                }
            }
        }
           });
	renderCalendar();
}
/* --- BIỂU ĐỒ CHI TIẾT THEO NGÀY (DOUGHNUT) --- */
let dailyChartInstance = null;

function openDailyStatsModal(dateStr, formattedDate) {
    document.getElementById('daily-modal-title').innerText = `Daily stats for ${formattedDate}`;
    document.getElementById('daily-stats-modal').style.display = 'flex';
    renderDailyChart(dateStr);
}

function closeDailyStatsModal() {
    document.getElementById('daily-stats-modal').style.display = 'none';
}

function renderDailyChart(dateStr) {
    const ctx = document.getElementById('dailyXPChart').getContext('2d');
    if (dailyChartInstance) dailyChartInstance.destroy();

    const labels = [];
    const data = [];
    const colors = [];
    let totalDayXP = 0;

   // NEW: Array to track activity for legend filtering
    const sectionActivity = [];
    const bgColors = [
        '#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', 
        '#e67e22', '#1abc9c', '#e84393', '#f39c12', '#d35400',
        '#55efc4', '#81ecec', '#74b9ff', '#a29bfe', '#ffeaa7', 
        '#fab1a0', '#ff7675', '#fd79a8', '#badc58', '#dff9fb',
        '#c0392b', '#2980b9', '#27ae60', '#f39c12', '#8e44ad', 
        '#d35400', '#16a085', '#2c3e50', '#192a56', '#441d49',
        '#00cec9', '#0984e3', '#6c5ce7', '#ff85a2', '#4cd137', 
        '#fbc531', '#487eb0', '#e056fd', '#ffbe76', '#ff7979',
        '#95afc0', '#22a6b3', '#be2edd', '#4834d4', '#130f40', 
        '#6ab04c', '#f9ca24', '#eb4d4b', '#7ed6df', '#5758bb'
    ];

    // Lọc data theo các bài kinh đã học trong ngày đó
    sections.forEach((sec, idx) => {
        const val = parseInt(localStorage.getItem(`daily_section_xp_${sec.id}_${dateStr}`) || 0);
        if (val > 0) {
            labels.push(sec.title);
            data.push(val);
            colors.push(bgColors[idx % bgColors.length]);
            totalDayXP += val;
            
            // NEW: Record last active time for this section
            const lastActive = parseInt(localStorage.getItem(`section_last_active_${sec.id}`) || 0);
            sectionActivity.push({ title: sec.title, lastActive: lastActive });
        }
    });

    // NEW: Determine Top 5 Most Recent Titles
    sectionActivity.sort((a, b) => b.lastActive - a.lastActive);
    const top5Titles = sectionActivity.slice(0, 5).map(s => s.title);
    const centerTextPlugin = {
        id: 'centerTextDaily',
        afterDatasetsDraw: function(chart) {
            const { ctx, chartArea: { top, bottom, left, right } } = chart;
            ctx.save();
            const centerX = (left + right) / 2;
            const centerY = (top + bottom) / 2;
            const chartHeight = bottom - top;
            const fontSizeMain = chartHeight / 10; 
            const fontSizeSub = chartHeight / 20;

            ctx.textAlign = "center"; ctx.textBaseline = "middle";
            ctx.font = `bold ${fontSizeMain}px sans-serif`;
            // Tuỳ biến chữ trắng trên nền thẻ Card xám đen
            ctx.fillStyle = "#FFFFFF"; 
            ctx.fillText(totalDayXP.toLocaleString(), centerX, centerY - (fontSizeMain * 0.15));
            ctx.font = `normal ${fontSizeSub}px sans-serif`;
            ctx.fillStyle = "#9ca3af";
            ctx.fillText("XP", centerX, centerY + (fontSizeMain * 0.75));
            ctx.restore();
        }
    };

    dailyChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{ 
                data: data, 
                backgroundColor: colors, 
                borderWidth: 1, 
                borderColor: '#1f2937' 
            }]
        },
        options: {
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#9ca3af', filter: function(item, chart) {
                            return top5Titles.includes(item.text);
                        } }, position: 'bottom' },
                title: { display: data.length === 0, text: 'No data available', position: 'bottom', color: '#6b7280' },
                tooltip: {
                    backgroundColor: '#121821', titleColor: '#f3f4f6', bodyColor: '#f3f4f6', borderColor: '#374151', borderWidth: 1, padding: 10,
                    callbacks: {
                        label: function(context) {
                            let value = context.raw;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(0) : 0;
                            return ` ${value} XP (${percentage}%)`;
                        }
                    }
                }
            }
        },
        plugins: [centerTextPlugin]
    });
}
function injectExamButton() {
    // Check if it already exists to avoid duplicates
    if (document.getElementById('final-exam-container')) return;

    const container = document.createElement('div');
    container.id = 'final-exam-container';
    // Added IDs to h4, p, and button for dynamic text updating
    container.innerHTML = `
       <h4 id="exam-title" style="margin-top:0; color:#b35900">Congratulations! You've mastered 100% of the lines!</h4>
        <p id="exam-desc">Pass the final assessment to earn your Certification.</p>
        <button id="exam-btn" class="btn-primary" onclick="startSectionExam()">Start Test</button>
    `;
    // Insert after dashboard grid
    const dashboard = document.getElementById('recitation-dashboard');
    dashboard.parentNode.insertBefore(container, dashboard.nextSibling);
}

function startSectionExam() {
    isSectionExam = true;
    quizQueue = [];
    const totalLines = allLines.length;
    
    // 1. Determine the Pool of Indices
    let pool = [];
    
    if (selectedLoopIndices.size > 0) {
        // PRIORITY: Create pool from User Selection (Long-pressed boxes)
        pool = Array.from(selectedLoopIndices);
    } else {
        // DEFAULT: Create pool from All Lines
        pool = Array.from({ length: totalLines }, (_, i) => i);
    }

    // 2. Shuffle the pool to ensure randomness
    for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    // 3. Determine Question Count based on Pool Size
    let questionCount = 10; // Default standard

    if (selectedLoopIndices.size > 0) {
        if (pool.length <= 2) {
            // Constraint: If 1 or 2 boxes selected -> Create 5 questions (cycling through them)
            questionCount = 5;
        
        } else {
            // Constraint: If >10 boxes selected -> Pick 10 unique ones
            questionCount = 10;
        }
    } else {
        // Standard Exam (No selection) -> 10 questions
        questionCount = (totalLines <= 2) ? 5 : 10;
    }

    // 4. Generate the Quiz Queue
    for (let i = 0; i < questionCount; i++) {
        // Use modulo to cycle through lines if pool is smaller than question count
        // (e.g., 2 selected boxes for 5 questions)
        let actualLineIdx = pool[i % pool.length];
        
        // Calculate difficulty
        // If we are repeating lines (repetition > 0), increase difficulty slightly
        let repetition = Math.floor(i / pool.length);
        let difficulty = 0.4 + (repetition * 0.1);
        if (difficulty > 0.6) difficulty = 0.6; // Cap at 60% hidden

        quizQueue.push(generateQuizData(actualLineIdx, difficulty));
    }

    // 5. Start Quiz
    currentQuizIndex = 0;
    
    // Update Title based on mode
    let titleText = "Comprehensive Test";
    if (selectedLoopIndices.size > 0) {
        titleText = `Review (${selectedLoopIndices.size} selected)`;
    }
    
    document.getElementById('quiz-title').innerText = `${titleText}`;
    openQuizModal();
}

function completeSectionExam() {
    // Save passed state
    const sectionPassedKey = `section_passed_${sections[currentSectionIndex].id}`;
    localStorage.setItem(sectionPassedKey, 'true');
    
    // Refresh stats to show banner
    updateOverallStats();
    
    // Scroll to banner
    document.getElementById('section-achievement-banner').scrollIntoView({behavior: 'smooth'});
    
    // Celebrate
    alert("Sādhu! You have successfully completed this sutta.");
}

// Global variable to ensure we don't spam the user if they close the modal in the same session
let hasSeenGlobalModal = false;

function showGrandAchievement() {
    if (hasSeenGlobalModal) return;
    
    const modal = document.getElementById('grand-achievement-modal');
    modal.style.display = 'flex'; // Use flex to center
}

function closeAchievementModal() {
    const modal = document.getElementById('grand-achievement-modal');
    modal.style.display = 'none';
    hasSeenGlobalModal = true; // Mark as seen for this page load
}

// Helper: Iterates through ALL sections data to calculate total mastery
function calculateGlobalStats() {
    let totalScore = 0;
    let maxScore = 0;

    // Loop through every section defined in your data
    sections.forEach(section => {
        // We need to parse the text to find how many "audio lines" exist
        // Regex to match lines ending in time marker [x.x]
        const lines = section.text.split('\n');
        let lineIndex = 0;

        lines.forEach(rawLine => {
            const line = rawLine.trim();
            if (line === '') return;

            // Check if it's a valid recitation line (has time marker)
            if (/\s*\[(\d+(\.\d+)?)\]\s*$/.test(line)) {
                
                // Reconstruct the storage key: memo_score_SECTIONID_LINEINDEX
                // Note: lineIndex increments only for valid audio lines
                const key = `memo_score_${section.id}_${lineIndex}`;
                const savedScore = localStorage.getItem(key);
                
                totalScore += savedScore ? parseInt(savedScore) : 0;
                maxScore += 100; // Each line is worth 100%
                
                lineIndex++;
            }
        });
    });

    return { currentScore: totalScore, maxScore: maxScore };
}

// Function to handle clicking a box
function jumpToLine(idx) {
    const wasPlaying = !audioPlayer.paused;
    if (recitationTimeout) { clearTimeout(recitationTimeout); recitationTimeout = null; }
    
    currentRecitationLine = idx;
    showRecitationLine(idx);
    
    // Sync Audio
    const targetEl = allLines[idx];
    const startTime = parseFloat(targetEl.dataset.startTime || 0);
    audioPlayer.currentTime = startTime;

    if (wasPlaying) {
        // If it was playing, keep playing from the new time
        audioPlayer.play();
        // You may need to update visuals to 'playing' state here if 'manual' sets it to pause
        // updateButtonVisuals('playing'); 
    } else {
        // If it was paused, keep it paused and update visuals
        updateButtonVisuals('manual'); 
        audioPlayer.pause();
    }
}
function toggleRecitationAction() {
    const isActive = displayArea.classList.contains('recitation-active');
    const isRunning = !!recitationTimeout;

    if (!isActive) {
        // Action: START RECITATION MODE (Manual Start)
        
        startRecitationMode();
        
        // --- CHANGE HERE: REMOVED audioPlayer.play() ---
        // By removing audioPlayer.play(), the mode starts but the audio remains paused.
        // startRecitationMode() already sets the initial line and the 'manual' visual state.
        
        return;
    }

    // We are already in Recitation Mode
    if (isRunning || !audioPlayer.paused) {
        // Action: PAUSE
        // This handles pausing when in auto-play or manual-play state.
        if (!audioPlayer.paused) audioPlayer.pause();
    } else {
        // Action: PLAY / RESUME
        if (audioPlayer.ended) {
            // If audio ended, reset, and start from the beginning
            audioPlayer.currentTime = 0;
            currentRecitationLine = 0;
            showRecitationLine(0);
        }
        // Simply call play. The 'play' event listener will trigger the self-correcting runRecitationStep.
        audioPlayer.play();
    }
}
function findRecitationLine(currentTime) {
        // Iterate backwards for slightly more efficient search, 
        // especially if seeking near the end.
        for (let i = allLines.length - 1; i >= 0; i--) {
            const line = allLines[i];
            const startTime = parseFloat(line.dataset.startTime || 0);
            const duration = parseFloat(line.dataset.duration || 0) / 1000;
            const endTime = startTime + duration;

            // If the current audio time is within this line's window
            if (currentTime >= startTime && currentTime < endTime) {
                return i;
            }
        }
        // If the current time is before the first line, return the first line (0)
        return 0;
    }
    function startRecitationMode() {
    resetText();
    displayArea.classList.add('recitation-active');
    document.body.classList.add('recitation-active-mode');
    
    if (typeof Website2APK !== 'undefined') {
        try {
            Website2APK.keepScreenOn(true);
        } catch (e) {
            console.log("Website2APK error: " + e);
        }
    }
    renderDashboard(); 
    // -------------------------------

    currentRecitationLine = 0;
    showRecitationLine(0);
    updateButtonVisuals('manual');
}

    function exitRecitation() {
        if(recitationTimeout) clearTimeout(recitationTimeout); recitationTimeout = null;
        if(!audioPlayer.paused) audioPlayer.pause();
   
        if (typeof Website2APK !== 'undefined') {
        try {
            Website2APK.keepScreenOn(false);
        } catch (e) {
            console.log("Website2APK error: " + e);
        }
    }
        displayArea.classList.remove('recitation-active');
        document.body.classList.remove('recitation-active-mode');
        document.querySelector('.line-recitation-show')?.classList.remove('line-recitation-show');
        
        // --- FIX: Remove all slider containers from the text ---
        document.querySelectorAll('.memorize-slider-container').forEach(el => el.remove());
        // -------------------------------------------------------
        updateOverallStats();
        updateButtonVisuals('inactive');
    }

    function runRecitationStep() {
    if (recitationTimeout) clearTimeout(recitationTimeout);
    
    // Safety check
    if (currentRecitationLine >= allLines.length) { exitRecitation(); return; }

    showRecitationLine(currentRecitationLine);
    updateButtonVisuals('auto'); 

    const el = allLines[currentRecitationLine];
    const dur = parseFloat(el.dataset.duration);
    const startTimeSeconds = parseFloat(el.dataset.startTime);

    let timeToNextStep = dur; 
    const isCustomSpeed = localStorage.getItem('overrideInterval') !== null;
    
    // --- 1. Calculate time remaining for current line ---
    if (!isCustomSpeed && !audioPlayer.paused) {
        const lineDurationSeconds = dur / 1000;
        const elapsedTimeSeconds = audioPlayer.currentTime - startTimeSeconds;
        const remainingDurationMs = (lineDurationSeconds - elapsedTimeSeconds) * 1000;
        
        if (remainingDurationMs > 50) {
            timeToNextStep = remainingDurationMs;
        } else {
            // If we are already past the time, force a tiny delay to trigger the transition immediately
            timeToNextStep = 10;
        }
    }

    // --- 2. Determine the Next Index (The Sequence Logic) ---
    recitationTimeout = setTimeout(() => {
        let nextIdx;

        if (isLoopActive) {
            // --- A. Loop Mode (Single or Selected Boxes) ---
            if (selectedLoopIndices.size > 0) {
                 // Multi-loop logic...
                 const sortedIndices = Array.from(selectedLoopIndices).sort((a, b) => a - b);
                 const nextInSequence = sortedIndices.find(i => i > currentRecitationLine);
                 nextIdx = nextInSequence !== undefined ? nextInSequence : sortedIndices[0];
            } else {
                 // Single Loop (Current Sentence)
                 nextIdx = currentRecitationLine; 
            }
        } else {
            // --- B. Normal Mode (Default: Loop Entire Section) ---
            nextIdx = currentRecitationLine + 1;
            
            // IF we reach the end, wrap back to 0 (Loop All)
            if (nextIdx >= allLines.length) {
                nextIdx = 0;
            }
        }

        // --- 3. Execute Transition ---
        if (nextIdx < allLines.length) {
            const prevLine = currentRecitationLine;
            currentRecitationLine = nextIdx;
            
            // Sync Audio logic
            // We need to seek audio if:
            // 1. Loop Mode is Active (Single or Multi jumping back)
            // 2. We wrapped around from End -> Start in Normal Mode (Loop All)
            
            const wrappedAround = (!isLoopActive && nextIdx === 0 && prevLine === allLines.length - 1);
            
            if ((isLoopActive || wrappedAround) && !isCustomSpeed) {
                const targetLine = allLines[currentRecitationLine];
                const newStart = parseFloat(targetLine.dataset.startTime);
                
                audioPlayer.currentTime = newStart;
                
                // Ensure audio resumes if it paused at the end of the track
                if (audioPlayer.paused) audioPlayer.play(); 
            }

            runRecitationStep(); 
        } else {
            // This path is now rarely taken unless the text is empty
            exitRecitation(); 
        }

    }, timeToNextStep);
}

    function showRecitationLine(idx) {
    // 1. Remove highlight from previous line
    document.querySelector('.line-recitation-show')?.classList.remove('line-recitation-show');
    
    // 2. Remove highlight from previous dashboard box
    document.querySelector('.progress-box.active-box')?.classList.remove('active-box');

    // 3. Highlight new line & new box
    if (allLines[idx]) {
        const lineDiv = allLines[idx];
        lineDiv.classList.add('line-recitation-show');
        lineDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Highlight box in dashboard
        const box = document.getElementById(`box-${idx}`);
        if(box) box.classList.add('active-box');

        // --- NEW: INJECT SLIDER ---
        injectSlider(lineDiv, idx);
    }
}

function injectSlider(lineElement, idx) {
    let container = lineElement.querySelector('.memorize-slider-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'memorize-slider-container';
        
        // 1. Checkbox Section
        const label = document.createElement('label');
        label.className = 'memorize-checkbox-label';
        
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.className = 'memorize-checkbox';
        input.id = `checkbox-${idx}`; 

        input.addEventListener('click', function(e) {
            const isChecked = this.checked;
            if (isChecked) {
                e.preventDefault(); 
                // Mode: 'check' -> Questions 1 & 2
                startLineTest(idx, 'check');
            } else {
                saveLineScore(idx, 0);
            }
        });

        const textSpan = document.createElement('span');
        textSpan.innerText = "Memorized"; 

        label.appendChild(input);
        label.appendChild(textSpan);
        container.appendChild(label);

        // 2. NEW: Practice Button Section
        const practiceBtn = document.createElement('button');
        practiceBtn.className = 'btn-practice';
        practiceBtn.innerHTML = '<i class="fas fa-bullseye-arrow"></i> Practicing';
        practiceBtn.onclick = function() {
            // Mode: 'practice' -> Questions 1 & 3
            startLineTest(idx, 'practice');
        };
        
        container.appendChild(practiceBtn);

        lineElement.appendChild(container);
    }

    // Sync state
    const currentScore = getLineScore(idx);
    const input = container.querySelector('input');
    input.checked = (currentScore >= 100);
}

/* --- HELPER: GET TRANSLATION FOR PALI LINE --- */
function getTranslationForLine(sectionIdx, targetLineIdx) {
    const lines = sections[sectionIdx].text.split('\n');
    let currentPaliIndex = -1;
    let paliText = "";
    
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (line === '') continue;
        
        const timeMatch = line.match(/\s*\[(\d+(\.\d+)?)\]\s*$/);
        if (timeMatch) {
            currentPaliIndex++;
            if (currentPaliIndex === targetLineIdx) {
                paliText = line.replace(timeMatch[0], '').trim();
                // Tìm dòng dịch (dòng tiếp theo không chứa time marker)
                for (let j = i + 1; j < lines.length; j++) {
                    let nextLine = lines[j].trim();
                    if (nextLine === '') continue;
                    if (!nextLine.match(/\s*\[(\d+(\.\d+)?)\]\s*$/)) {
                        return { pali: paliText, trans: nextLine };
                    } else {
                        break; // Gặp câu Pali tiếp theo -> Không có bản dịch
                    }
                }
                return { pali: paliText, trans: "(No translation)" };
            }
        }
    }
    return { pali: "", trans: "" };
}

/* --- HELPER: GET RANDOM DISTRACTORS FROM ALL SECTIONS --- */
function getRandomTranslations(count, excludeTrans) {
    let finalDistractors = [];

    // 1. Tạo mảng chứa thứ tự ưu tiên các Section
    // Bắt đầu bằng section hiện tại
    let prioritizedIndices = [currentSectionIndex]; 
    let maxOffset = Math.max(currentSectionIndex, sections.length - 1 - currentSectionIndex);

    // Mở rộng dần ra: Liền trước (-1) rồi Liền sau (+1), tiếp tục (-2) rồi (+2)...
    for (let offset = 1; offset <= maxOffset; offset++) {
        let prev = currentSectionIndex - offset;
        let next = currentSectionIndex + offset;

        if (prev >= 0) prioritizedIndices.push(prev);
        if (next < sections.length) prioritizedIndices.push(next);
    }

    // 2. Duyệt qua từng section theo thứ tự ưu tiên
    for (let secIdx of prioritizedIndices) {
        let currentSecTrans = [];
        const lines = sections[secIdx].text.split('\n');
        
        // Lấy tất cả các câu dịch trong section này
        lines.forEach(line => {
            let l = line.trim();
            // Bỏ qua dòng trống và dòng Pali (có time marker)
            if (l !== '' && !l.match(/\s*\[(\d+(\.\d+)?)\]\s*$/)) {
                currentSecTrans.push(l);
            }
        });

        // 3. Lọc trùng lặp, loại câu ngắn (<=5), loại đáp án đúng, 
        // VÀ loại cả những đáp án đã được đưa vào mảng finalDistractors trước đó
        let uniqueValidTrans = [...new Set(currentSecTrans)].filter(t => 
            t !== excludeTrans && 
            t.length > 5 && 
            !finalDistractors.includes(t)
        );

        // 4. Trộn ngẫu nhiên danh sách hợp lệ của section này
        uniqueValidTrans.sort(() => 0.5 - Math.random());

        // 5. Bổ sung từ từ vào danh sách kết quả cuối cùng cho đến khi đủ số lượng
        for (let trans of uniqueValidTrans) {
            if (finalDistractors.length < count) {
                finalDistractors.push(trans);
            }
            // Nếu đã lấy đủ thì ngắt vòng lặp và trả về kết quả luôn
            if (finalDistractors.length === count) {
                return finalDistractors; 
            }
        }
    }

    // Trả về số lượng thu thập được (phòng trường hợp toàn bộ dữ liệu vẫn không đủ 'count')
    return finalDistractors;
}

/* --- GENERATE TRANSLATION QUIZ DATA --- */
function generateTranslationQuizData(lineIdx) {
    const { pali, trans } = getTranslationForLine(currentSectionIndex, lineIdx);
    // Lấy 3 đáp án nhiễu
    const distractors = getRandomTranslations(3, trans);
    
    let options = [trans, ...distractors];
    // Trộn ngẫu nhiên vị trí của 4 đáp án
    options.sort(() => 0.5 - Math.random()); 
    
    return {
        type: 'translation',
        paliText: pali,
        correctTranslation: trans,
        options: options,
        userAnswer: null
    };
}

let isPracticeMode = false; // Flag to track if we are in practice mode

function startLineTest(idx, mode = 'check') {
    isSectionExam = false;
    currentTargetLineIndex = idx;
    quizQueue = [];
    
    // Set global flag
    isPracticeMode = (mode === 'practice');

    // === NEW LOGIC: MULTI-SELECT PRACTICE MODE ===
    // If user clicked "Luyện Tập" AND has specific boxes selected via Long Press
    if (isPracticeMode && selectedLoopIndices.size > 0) {
        
        // 1. Get selected lines and sort them (e.g., 3, 5, 7)
        const sortedIndices = Array.from(selectedLoopIndices).sort((a, b) => a - b);
        
        // 2. Generate Q1 (Fill Blank) and Q3 (Translation) for EACH selected line
        sortedIndices.forEach(lineIdx => {
            // Question 1: Fill in the blank (Current Line)
            quizQueue.push(generateQuizData(lineIdx, 0.4));
            
            // Question 3: Vietnamese Translation (Current Line)
            quizQueue.push(generateTranslationQuizData(lineIdx));
        });

        // 3. Update Title
        document.getElementById('quiz-title').innerText = `Practicing (${sortedIndices.length} selected)`;

    } else {
        // === ORIGINAL LOGIC: SINGLE LINE MODE ===
        
        // Question 1: Fill Blank (Current Line)
        quizQueue.push(generateQuizData(idx, 0.4));

        // Question 2: Previous Sentence (if exists) - Only for standard Check/Practice
        if (idx > 0) {
            quizQueue.push(generateQuizData(idx - 1, 0.4));
        }
        
        // Question 3: Translation
        quizQueue.push(generateTranslationQuizData(idx));

        // Set Title based on mode
        if (mode === 'check') {
            document.getElementById('quiz-title').innerText = "Memorize Test";
        } else if (mode === 'practice') {
            document.getElementById('quiz-title').innerText = "Practicing";
        }
    }

    currentQuizIndex = 0;
    openQuizModal();
}


function openQuizModal() {
    document.getElementById('quiz-modal').style.display = 'flex';
    renderQuizStep();
}

function closeQuizModal() {
    document.getElementById('quiz-modal').style.display = 'none';
    quizQueue = [];
}

function renderQuizStep() {
    const data = quizQueue[currentQuizIndex];
    const total = quizQueue.length;
    
    // Update Progress
    document.getElementById('quiz-progress').innerText = `Quiz ${currentQuizIndex + 1}/${total}`;
    document.getElementById('btn-quiz-next').disabled = true;
    document.getElementById('btn-quiz-next').innerText = (currentQuizIndex === total - 1) ? "Complete" : "Continue";
    document.getElementById('btn-quiz-reset').style.display = 'none';

    const sentenceArea = document.getElementById('quiz-sentence-area');
    const optionsArea = document.getElementById('quiz-options-area');
    const instructionText = document.getElementById('quiz-instruction-text'); // Target the instruction
    
    sentenceArea.innerHTML = '';
    optionsArea.innerHTML = '';

    // === NẾU LÀ CÂU HỎI TRẮC NGHIỆM TIẾNG VIỆT ===
    if (data.type === 'translation') {
        
        // Cập nhật câu hướng dẫn
        if (instructionText) instructionText.innerText = "What is the meaning of this Pali sentence?";
        
        // Render Text Question (Removed redundant labels, just keeping the Pali text)
        sentenceArea.innerHTML = `
            <div style="font-weight: bold; color: var(--primary-color); font-size: 20px; text-align: center; padding: 10px 0;">"${data.paliText}"</div>
        `;
        
        // Đặt layout dọc cho các đáp án dài
        optionsArea.style.flexDirection = 'column';
        optionsArea.style.alignItems = 'stretch';
        
        data.options.forEach((opt, i) => {
            const btn = document.createElement('div');
            btn.className = 'quiz-option translation-option';
            btn.innerText = opt;
            btn.dataset.optIndex = i;
            
            // Giữ trạng thái chọn nếu render lại
            if (data.userAnswer === opt) {
                btn.style.backgroundColor = 'var(--highlight-color)';
                btn.style.color = '#fff';
            }
            
            btn.onclick = () => selectTranslationOption(opt, btn);
            optionsArea.appendChild(btn);
        });
    } 
    // === NẾU LÀ CÂU HỎI ĐIỀN TỪ (MẶC ĐỊNH CŨ) ===
    else {
        
        // Cập nhật câu hướng dẫn về mặc định
        if (instructionText) instructionText.innerText = "Select the words below to fill in the blanks:";

        optionsArea.style.flexDirection = 'row'; // Trả về layout cũ
        optionsArea.style.alignItems = 'center';

        // 1. Render Sentence with Blanks
        data.originalWords.forEach((word, i) => {
            if (data.hiddenIndices.includes(i)) {
                const blankIdx = data.hiddenIndices.indexOf(i);
                const span = document.createElement('span');
                span.className = 'quiz-blank';
                span.dataset.wordIndex = i;
                span.dataset.blankIndex = blankIdx;
                span.innerHTML = "&nbsp;&nbsp;&nbsp;";
                
                span.onclick = () => clearBlank(blankIdx);
                sentenceArea.appendChild(span);
            } else {
                const span = document.createElement('span');
                span.innerText = word + " ";
                sentenceArea.appendChild(span);
            }
        });

        // 2. Render Word Bank
        data.wordBank.forEach((word, i) => {
            const btn = document.createElement('div');
            btn.className = 'quiz-option';
            btn.innerText = word;
            btn.dataset.optIndex = i;
            btn.onclick = () => selectOption(i, word);
            optionsArea.appendChild(btn);
        });
    }
}

// Hàm chọn đáp án cho câu hỏi Dịch tiếng Việt
function selectTranslationOption(optText, btnElement) {
    const data = quizQueue[currentQuizIndex];
    if (!data || data.type !== 'translation') return;
    
    data.userAnswer = optText;
    
    // Đặt lại style cho tất cả các nút
    const allOpts = document.querySelectorAll('.translation-option');
    allOpts.forEach(el => {
        el.style.backgroundColor = '';
        el.style.color = '';
    });
    
    // Highlight nút được chọn
    btnElement.style.backgroundColor = 'var(--highlight-color)';
    btnElement.style.color = '#fff';
    
    checkStepCompletion();
}

function selectOption(optIndex, word) {
    const data = quizQueue[currentQuizIndex];
    
    // Find first empty blank
    const emptyBlankIndex = data.userAnswers.findIndex(ans => ans === null);
    
    if (emptyBlankIndex === -1) return; // All full

    // Fill data
    data.userAnswers[emptyBlankIndex] = { word: word, optIndex: optIndex };
    
    // Update UI
    const blankEl = document.querySelector(`.quiz-blank[data-blank-index="${emptyBlankIndex}"]`);
    blankEl.innerText = word;
    blankEl.classList.add('filled');
    blankEl.classList.remove('error');

    // Mark option used
    const optEl = document.querySelector(`.quiz-option[data-opt-index="${optIndex}"]`);
    optEl.classList.add('used');

    checkStepCompletion();
}

function clearBlank(blankIdx) {
    const data = quizQueue[currentQuizIndex];
    const answer = data.userAnswers[blankIdx];
    
    if (!answer) return;

    // Restore option
    const optEl = document.querySelector(`.quiz-option[data-opt-index="${answer.optIndex}"]`);
    if(optEl) optEl.classList.remove('used');

    // Clear data
    data.userAnswers[blankIdx] = null;

    // Clear UI
    const blankEl = document.querySelector(`.quiz-blank[data-blank-index="${blankIdx}"]`);
    blankEl.innerHTML = "&nbsp;&nbsp;&nbsp;";
    blankEl.classList.remove('filled', 'error');
    
    checkStepCompletion();
}

function checkStepCompletion() {
    const data = quizQueue[currentQuizIndex];
    const btnNext = document.getElementById('btn-quiz-next');
    
    if (data.type === 'translation') {
        if (data.userAnswer !== null) {
            btnNext.disabled = false;
            btnNext.onclick = validateCurrentQuestion;
        } else {
            btnNext.disabled = true;
        }
    } else {
        const isFull = data.userAnswers.every(ans => ans !== null);
        if (isFull) {
            btnNext.disabled = false;
            btnNext.onclick = validateCurrentQuestion;
        } else {
            btnNext.disabled = true;
        }
    }
}

function validateCurrentQuestion() {
    const data = quizQueue[currentQuizIndex];
    let isCorrect = true;

    if (data.type === 'translation') {
        isCorrect = (data.userAnswer === data.correctTranslation);
        
        // Highlight Đúng/Sai
        const allOpts = document.querySelectorAll('.translation-option');
        allOpts.forEach(el => {
            // FIX: Only apply colors to the option the user actually clicked
            if (el.innerText === data.userAnswer) {
                if (isCorrect) {
                    el.style.backgroundColor = '#27ae60'; // Xanh lá = Đúng
                    el.style.color = 'white';
                    el.style.borderColor = '#27ae60';
                } else {
                    el.style.backgroundColor = '#c0392b'; // Đỏ = Sai
                    el.style.color = 'white';
                    el.style.borderColor = '#c0392b';
                }
            }
        });
    } else {
        // Logic kiểm tra câu điền từ cũ
        data.hiddenIndices.forEach((wordIdx, i) => {
            const correctWordClean = cleanPaliWord(data.originalWords[wordIdx]);
            const userWord = data.userAnswers[i] ? data.userAnswers[i].word : ""; 
            const blankEl = document.querySelector(`.quiz-blank[data-blank-index="${i}"]`);

            if (correctWordClean !== userWord) {
                isCorrect = false;
                blankEl.classList.add('error');
            } else {
                blankEl.classList.remove('error');
                blankEl.classList.add('filled');
            }
        });
    }

    if (isCorrect) {
        if (currentQuizIndex < quizQueue.length - 1) {
            // Đợi 1 giây để người dùng nhìn thấy đáp án xanh lá rồi mới qua câu
            setTimeout(() => {
                currentQuizIndex++;
                renderQuizStep();
            }, 400); 
        } else {
            setTimeout(finishQuizSuccess, 400);
        }
    } else {
        const btnReset = document.getElementById('btn-quiz-reset');
        btnReset.style.display = 'inline-block';
        document.getElementById('btn-quiz-next').disabled = true;
        if (navigator.vibrate) navigator.vibrate(200);
    }
}

function resetCurrentQuestion() {
    const data = quizQueue[currentQuizIndex];
    if (data.type === 'translation') {
        data.userAnswer = null;
    } else {
        data.userAnswers.fill(null);
    }
    renderQuizStep(); 
}

function finishQuizSuccess() {
    // 1. Logic for "Check Mode" (Đã thuộc)
    if (!isSectionExam && !isPracticeMode && currentTargetLineIndex !== -1) {
        const checkbox = document.getElementById(`checkbox-${currentTargetLineIndex}`);
        if (checkbox) checkbox.checked = true;
        saveLineScore(currentTargetLineIndex, 100);
    }

    // 2. XP REWARD
    const currentSectionId = sections[currentSectionIndex].id;
    let xpEarned = quizQueue.length; // Default base
        alert(`Completed! You received +${quizQueue.length} XP.`);
 

    addSectionXP(currentSectionId, xpEarned);

    // 3. Cleanup
    closeQuizModal();
    
    setTimeout(() => {
        if (isSectionExam) {
            completeSectionExam();
        } else {
            updateOverallStats(); 
        }
    }, 150); 
}

function navigateRecitation(d) {
        // 1. Check if audio is currently playing before we do anything
        const isPlaying = !audioPlayer.paused && !audioPlayer.ended;
        
        // 2. Clear the existing timer so we don't have overlapping jumps
        if (recitationTimeout) { clearTimeout(recitationTimeout); recitationTimeout = null; }
        
        // 3. Activate recitation mode if it wasn't already (Edge case)
        if (!displayArea.classList.contains('recitation-active')) { 
            startRecitationMode();
        }
        
        // 4. Update the line index
        currentRecitationLine += d;
        if (currentRecitationLine < 0) currentRecitationLine = 0;
        if (currentRecitationLine >= allLines.length) currentRecitationLine = allLines.length - 1;

        // 5. Show the new line visually
        showRecitationLine(currentRecitationLine);

        // 6. Sync the audio to the start time of the new line
        const targetEl = allLines[currentRecitationLine];
        const startTimeSeconds = parseFloat(targetEl.dataset.startTime || 0);
        audioPlayer.currentTime = startTimeSeconds; 
        
        // 7. Decide logic based on previous state
        if (isPlaying) {
            // If it was playing:
            // We do NOT pause. We just restart the sync timer (runRecitationStep)
            // so it counts down the duration of this new line correctly.
            runRecitationStep();
        } else {
            // If it was paused:
            // Keep it paused and show the "Manual" (Play button) state.
            updateButtonVisuals('manual');
        }
    }

    // --- CÁC HÀM PHỤ ---
    function hideRandomWords() {
        const wasActive = displayArea.classList.contains('recitation-active');
        resetText(true);
        const words = document.querySelectorAll('.word');
        const count = Math.floor(words.length * (document.getElementById('difficulty').value / 100));
        Array.from({length: words.length}, (_, i) => i).sort(() => Math.random()-.5).slice(0, count).forEach(i => words[i].classList.add('hidden'));
        
        if (wasActive) {
            displayArea.classList.add('recitation-active');
            updateButtonVisuals('manual');
        }
    }
    
    function resetText(keep = false) {
        if (!keep) exitRecitation();
        document.querySelectorAll('.word').forEach(w => w.classList.remove('hidden', 'revealed'));
    }

    function toggleSettings() { settingsPanel.classList.toggle('open'); }
    function updateLabel(v) { document.getElementById('difficulty-label').innerText = v + "%"; }
    
    // --- CÁC HÀM MỚI CHO TỐC ĐỘ ---

    function toggleSpeedControl() {
        document.getElementById('btn-show-speed').style.display = 'none';
		document.getElementById('btn-show-speed2').style.display = 'none';
        document.getElementById('speed-control-area').style.display = 'flex';
    }

    function updateRecitationInterval(v) { 
        const newIntervalSeconds = parseFloat(v);
        localStorage.setItem('overrideInterval', newIntervalSeconds.toFixed(1)); 
        
        document.getElementById('recitation-interval-label').innerText = newIntervalSeconds.toFixed(1) + "s";
        loadSection(currentSectionIndex); 
        if(!audioPlayer.paused && displayArea.classList.contains('recitation-active')) audioPlayer.pause();
    }

    function resetSpeedDefault() {
        localStorage.removeItem('overrideInterval');
        document.getElementById('recitation-interval').value = 3;
        document.getElementById('recitation-interval-label').innerText = "3.0s";
        document.getElementById('speed-control-area').style.display = 'none';
        document.getElementById('btn-show-speed').style.display = 'inline-block';
		document.getElementById('btn-show-speed2').style.display = 'inline-block';
        loadSection(currentSectionIndex);
    }
    
    function toggleTheme() {
        const body = document.body;
        const btn = document.querySelector('.btn-darkmode');
        const isDark = body.getAttribute('data-theme') === 'dark';

        if (isDark) {
            body.removeAttribute('data-theme');
            btn.innerHTML = '<i class="fas fa-moon"></i>';
            localStorage.setItem('themePreference', 'light');
        } else {
            body.setAttribute('data-theme', 'dark');
            btn.innerHTML = '<i class="fas fa-sun-bright"></i>';
            localStorage.setItem('themePreference', 'dark');
        }
    }

    init();

