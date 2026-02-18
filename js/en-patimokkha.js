/* =========================================
   FULL PALI LOOKUP INTEGRATION
   ========================================= */

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

/* --- CORE HANDLER (Adapted from pali-lookup-standalone.js) --- */
function lookupWordHandler(event) {
    if (!window.paliDictionary) return;
    if ($(this).children().is("span.meaning")) return;

    const isRecitationActive = document.body.classList.contains('recitation-active-mode');

    if (isRecitationActive) {
        const rawText = this.innerText || "";
        const cleanText = rawText.toLowerCase().replace(/[.,:;!?'"“”‘’()\[\]{}...–-]/g, '').trim();

        // 1. FIND WORD POSITION (Index in the sentence/line)
        // This finds how many '.word' siblings are before this one
        const wordIndex = $(this).parent().find('.word').index(this);

        // 2. DEFINE THEME-SPECIFIC COLORS (20 for each)
        const isDarkMode = document.body.getAttribute('data-theme') === 'dark';

        // High-contrast, darker colors for Light Mode
        const lightModeColors = [
            '#c0392b', '#2980b9', '#27ae60', '#8e44ad', '#d35400', 
            '#2c3e50', '#16a085', '#b53471', '#5758bb', '#1b1464',
            '#006266', '#6F1E51', '#1289A7', '#D980FA', '#0652DD',
            '#c23616', '#192a56', '#2f3640', '#44bd32', '#833471'
        ];

        // Vibrant, glowing colors for Dark Mode
        const darkModeColors = [
            '#ff7675', '#74b9ff', '#55e6c1', '#a29bfe', '#fab1a0',
			'#18dcff', '#7d5fff', '#ffaf40', '#32ff7e', '#ff3838',
            '#ffeaa7', '#81ecec', '#fdcb6e', '#fd79a8', '#55efc4',
            '#00d2d3', '#00cec9', '#fab1a0', '#ff9f43', '#fffa65',
        ];

        const colorPalette = isDarkMode ? darkModeColors : lightModeColors;
        // Use Modulo to cycle colors so neighbor words are always different
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

        // 4. RENDER
        let symbolsHtml = rhythm.map(icon => {
            const size = (icon === 'fa-minus') ? '18px' : '10px';
            // Slight text-shadow added for "pop" against background textures
            return `<i class="fas ${icon}" style="font-size: ${size}; margin: 0 4px; text-shadow: 1px 1px 1px rgba(0,0,0,0.1);"></i>`;
        }).join('');

        const textBox = $(`
            <span class="meaning" style="min-width: 60px; padding: 12px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                <div style="color: ${wordColor}; display: flex; align-items: center; justify-content: center; gap: 2px;">
                    ${symbolsHtml}
                </div>
            </span>
        `);
        
        $(this).append(textBox);
        
        var offset = $(this).offset();
        if (offset.left + textBox.outerWidth() > $(window).width()) {
             textBox.css({left: 'auto', right: 0});
        }
        return; 
    }

 

    // ... [Rest of function for Dictionary Logic remains exactly the same] ...
    var rawText = $(this).text();
    var word = rawText.toLowerCase().trim();


    // CRITICAL FIX: Remove punctuation from edges
    word = word.replace(/^[“‘"(\[]+|[”’"),‚.\]?!:–;]+$/g, '');

    // Standard replacements
    word = word.replace(/­/g, ''); 
    word = word.replace(/ṁg/g, 'ṅg')
               .replace(/ṁk/g, 'ṅk')
               .replace(/ṁ/g, 'ṁ'); 

    // Perform Lookup
    var meaning = lookupWord(word, rawText); 
    
    if (meaning) {
        var textBox = $('<span class="meaning">' + meaning + '</span>');
        $(this).append(textBox);
        
        // Prevent popup from going off-screen (Right edge detection)
        var offset = $(this).offset();
        var width = 300; // approx max width
        if (offset.left + width > $(window).width()) {
             textBox.css({left: 'auto', right: 0});
        }
    }
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


    // --- DỮ LIỆU ---
    const sections = [
      {
    id: 'Nidānuddeso', title: 'Nidānuddeso', audio: '0-Nidanuddeso.mp3',
    text: `Namo tassa Bhagavato Arahato Sammāsambuddhassa. [5.019]
Homage to the Blessed One, the Worthy One, the Rightly Self-awakened One.
Namo tassa Bhagavato Arahato Sammāsambuddhassa. [5.042]
Homage to the Blessed One, the Worthy One, the Rightly Self-awakened One.
Namo tassa Bhagavato Arahato Sammāsambuddhassa. [6.308]
Homage to the Blessed One, the Worthy One, the Rightly Self-awakened One.
Suṇātu me bhante (āvuso) saṅgho. Ajjuposatho pannaraso, yadi saṅghassa pattakallaṃ, saṅgho uposathaṃ kareyya, pātimokkhaṃ uddiseyya. [12.409]
Let the community listen to me, (venerable sirs/friends). Today is the fifteenth day Uposatha. If the community is ready, it should perform the Uposatha and recite the Pātimokkha.
Kiṃ saṅghassa pubbakiccaṃ? Pārisuddhiṃ āyasmanto ārocetha, [5.733]
What is the preliminary duty of the community? Venerable sirs, announce your purity.
pātimokkhaṃ uddisissāmi, [2.542]
I shall recite the Pātimokkha.
taṃ sabbeva santā sādhukaṃ suṇoma manasi karoma. [4.134]
All of us being present, let us listen well and pay close attention.
Yassa siyā āpatti, so āvikareyya, asantiyā āpattiyā tuṇhī bhavitabbaṃ, [6.082]
Whoever has an offense should disclose it. If there is no offense, one should remain silent.
tuṇhībhāvena kho panāyasmante “parisuddhā”ti vedissāmi. [5.325]
By your silence, I shall know that you are pure.
Yathā kho pana paccekapuṭṭhassa veyyākaraṇaṃ hoti, evamevaṃ evarūpāya parisāya yāvatatiyaṃ anusāvitaṃ hoti. [9.090]
Just as there is an answer for a specific question, so in an assembly such as this, it is announced up to the third time.
Yo pana bhikkhu yāvatatiyaṃ anusāviyamāne saramāno santiṃ āpattiṃ nāvikareyya, [6.201]
Whatever monk, when it is announced up to the third time, remembers an existing offense and does not disclose it,
sampajānamusāvādassa hoti. [2.711]
he is guilty of intentional lying.
Sampajānamusāvādo kho panāyasmanto antarāyiko dhammo vutto bhagavatā, [5.763]
Venerable sirs, intentional lying has been called an obstructive state by the Blessed One.
tasmā saramānena bhikkhunā āpannena visuddhāpekkhena santī āpatti āvikātabbā, āvikatā hissa phāsu hoti. [8.857]
Therefore, an existing offense should be disclosed by a monk who has fallen into one, who remembers it, and who desires purity; for when it is disclosed, it is easy for him.
Uddiṭṭhaṃ kho āyasmanto nidānaṃ. Tatthāyasmante pucchāmi, kaccittha parisuddhā, [5.832]
Venerable sirs, the introduction has been recited. In this regard, I ask you: Are you pure in this?
dutiyampi pucchāmi, kaccittha parisuddhā, tatiyampi pucchāmi, kaccittha parisuddhā, [5.092]
A second time I ask: Are you pure? A third time I ask: Are you pure?
parisuddhetthāyasmanto, tasmā tuṇhī, evametaṃ dhārayāmīti. Nidānuddeso paṭhamo [8.3]
You are pure in this, therefore you are silent. Thus do I understand it. The first section, the Introduction, is finished.`
},

{
    id: 'Pr.1', title: 'Pārājika 1', audio: '1Pr-01.mp3',
    text: `Tatrime cattāro pārājikā dhammā uddesaṃ āgacchanti. [5.0]
Now, these four Pārājika rules come into recitation.
Yo pana bhikkhu bhikkhūnaṃ sikkhāsājīvasamāpanno sikkhaṃ appaccakkhāya dubbalyaṃ anāvikatvā methunaṃ dhammaṃ paṭiseveyya, [8.56]
Whatever monk, having undertaken the monks' training and system of life, without having renounced the training and without having declared his weakness, should engage in sexual intercourse,
antamaso tiracchānagatāyapi, pārājiko hoti asaṃvāso. [5.5]
even with a female animal, is one who is defeated and no longer in communion.`
},

{
    id: 'Pr.2', title: 'Pārājika 2', audio: '1Pr-02.mp3',
    text: `Yo pana bhikkhu gāmā vā araññā vā adinnaṃ theyyasaṅkhātaṃ ādiyeyya, [5.2]
Whatever monk should take by way of theft what has not been given, from a village or from a forest,
yathārūpe adinnādāne rājāno coraṃ gahetvā haneyyuṃ vā bandheyyuṃ vā pabbājeyyuṃ vā [8.0]
in such a manner of taking what is not given that kings, having seized the thief, would kill, bind, or banish him,
corosi bālosi mūḷhosi thenosīti, [3.6]
saying, "You are a thief, you are a fool, you are a localized idiot, you are a robber";
tathārūpaṃ bhikkhu adinnaṃ ādiyamāno ayampi pārājiko hoti asaṃvāso. [5.6]
the monk who takes what is not given in such a manner is also one who is defeated and no longer in communion.`
},

{
    id: 'Pr.3', title: 'Pārājika 3', audio: '1Pr-03.mp3',
    text: `Yo pana bhikkhu sañcicca manussaviggahaṃ jīvitā voropeyya, satthahārakaṃ vāssa pariyeseyya, [6.2]
Whatever monk should intentionally deprive a human being of life, or look for an assassin for him,
maraṇavaṇṇaṃ vā saṃvaṇṇeyya, maraṇāya vā samādapeyya [3.85]
or should praise the beauty of death, or should incite him to death, saying:
"ambho purisa kiṃ tuyhiminā pāpakena dujjīvitena, mataṃ te jīvitā seyyo"ti, [5.5]
"My good man, what is the use of this miserable, evil life to you? Death is better for you than life";
iti cittamano cittasaṅkappo anekapariyāyena maraṇavaṇṇaṃ vā saṃvaṇṇeyya, maraṇāya vā samādapeyya, [6.7]
if with such a thought and such a purpose he should in various ways praise the beauty of death or incite him to death,
ayampi pārājiko hoti asaṃvāso. [3.5]
he also is one who is defeated and no longer in communion.`
},

{
    id: 'Pr.4', title: 'Pārājika 4', audio: '1Pr-04.mp3',
    text: `Yo pana bhikkhu anabhijānaṃ uttarimanussadhammaṃ attupanāyikaṃ alamariyañāṇadassanaṃ samudācareyya [6.85]
Whatever monk, without fully knowing, should falsely claim a superior human state, knowledge and vision worthy of the noble ones, available to himself,
“iti jānāmi, iti passāmī”ti, tato aparena samayena samanuggāhīyamāno vā [5.35]
saying, "Thus I know, thus I see"; and then later, whether he is questioned or
asamanuggāhīyamāno vā āpanno visuddhāpekkho evaṃ vadeyya [4.65]
not questioned, having fallen into an offense and desiring purity, should say:
“ajānamevaṃ āvuso avacaṃ jānāmi, apassaṃ passāmi, tucchaṃ musā vilapi”nti, [5.1]
"Friends, not knowing, I said 'I know'; not seeing, I said 'I see'; I have spoken idly, falsely, and vainly,"
aññatra adhimānā, ayampi pārājiko hoti asaṃvāso. [5.0]
except for overestimation of oneself, he also is one who is defeated and no longer in communion.`
},

{
    id: 'Pr.U', title: 'Pārājika Uddiṭṭhā', audio: '1Pr-U.mp3',
    text: `Uddiṭṭhā kho āyasmanto cattāro pārājikā dhammā. [3.91]
Venerable sirs, the four Pārājika rules have been recited.
Yesaṃ bhikkhu aññataraṃ vā aññataraṃ vā āpajjitvā na labhati bhikkhūhi saddhiṃ saṃvāsaṃ [5.9]
The monk who falls into any one of these no longer obtains communion with the monks.
yathā pure, tathā pacchā, pārājiko hoti asaṃvāso. [4.2]
As before, so after: he is defeated and no longer in communion.
Tatthāyasmante pucchāmi, kaccittha parisuddhā, dutiyampi pucchāmi, kaccittha parisuddhā, [5.1]
In this regard, I ask the venerable sirs: Are you pure in this? A second time I ask: Are you pure?
tatiyampi pucchāmi, kaccittha parisuddhā, parisuddhetthāyasmanto, tasmā tuṇhī, [5.2]
A third time I ask: Are you pure? You are pure in this, therefore you are silent.
evametaṃ dhārayāmīti. Pārājikuddeso dutiyo [5.5]
Thus do I understand it. The second section, on Defeat, is finished.`
},

{
    id: 'Sg.1', title: 'Saṅghādisesa 1', audio: '2Sg-01.mp3',
    text: `Ime kho panāyasmanto terasa saṅghādisesā Dhammā uddesaṃ āgacchanti. [5.6]
Venerable sirs, these thirteen Saṅghādisesa rules come into recitation.
Sañcetanikā sukkavissaṭṭhi aññatra supinantā saṅghādiseso. [5.0]
The intentional emission of semen, except during a dream, is a Saṅghādisesa.`
},

{
    id: 'Sg.2', title: 'Saṅghādisesa 2', audio: '2Sg-02.mp3',
    text: `Yo pana bhikkhu otiṇṇo vipariṇatena cittena mātugāmena saddhiṃ kāyasaṃsaggaṃ samāpajjeyya [6.3]
Whatever monk, overcome by lust, with altered mind, should engage in bodily contact with a woman,
hatthaggāhaṃ vā veṇiggāhaṃ vā aññatarassa vā aññatarassa vā aṅgassa parāmasanaṃ, saṅghādiseso. [8.0]
holding her hand, or holding a braid of hair, or stroking any limb or other part of her body, is a Saṅghādisesa.`
},

{
    id: 'Sg.3', title: 'Saṅghādisesa 3', audio: '2Sg-03.mp3',
    text: `Yo pana bhikkhu otiṇṇo vipariṇatena cittena mātugāmaṃ duṭṭhullāhi vācāhi obhāseyya [6.2]
Whatever monk, overcome by lust, with altered mind, should address a woman with lewd words,
yathā taṃ yuvā yuvatiṃ methunupasaṃhitāhi, saṅghādiseso. [4.8]
as a young man to a young woman, concerning sexual intercourse, is a Saṅghādisesa.`
},

{
    id: 'Sg.4', title: 'Saṅghādisesa 4', audio: '2Sg-04.mp3',
    text: `Yo pana bhikkhu otiṇṇo vipariṇatena cittena mātugāmassa santike attakāmapāricariyāya vaṇṇaṃ bhāseyya [6.7]
Whatever monk, overcome by lust, with altered mind, should speak in the presence of a woman in praise of ministering to his own sensual needs,
“etadaggaṃ bhagini pāricariyānaṃ yā mādisaṃ sīlavantaṃ kalyāṇadhammaṃ brahmacāriṃ [5.6]
saying, "Sister, this is the highest of services: that one should minister to such a virtuous, fine-natured person living the holy life as me
etena dhammena paricareyyā”ti methunupasaṃhitena, saṅghādiseso. [5.2]
with this act"—meaning sexual intercourse—is a Saṅghādisesa.`
},

{
    id: 'Sg.5', title: 'Saṅghādisesa 5', audio: '2Sg-05.mp3',
    text: `Yo pana bhikkhu sañcarittaṃ samāpajjeyya itthiyā vā purisamatiṃ purisassa vā itthimatiṃ, [5.9]
Whatever monk should engage in go-between work, of a woman to a man, or of a man to a woman,
jāyattane vā jārattane vā, antamaso taṅkhaṇikāyapi, saṅghādiseso. [6.0]
whether as a wife or as a mistress, or even for a temporary meeting, is a Saṅghādisesa.`
},

{
    id: 'Sg.6', title: 'Saṅghādisesa 6', audio: '2Sg-06.mp3',
    text: `Saññācikāya pana bhikkhunā kuṭiṃ kārayamānena assāmikaṃ attuddesaṃ pamāṇikā kāretabbā. [6.9]
A monk who is having a hut built for himself by his own begging, where there is no owner and which is for himself, must have it built to the proper measurements.
Tatridaṃ pamāṇaṃ: dīghaso dvādasa vidatthiyo sugatavidatthiyā tiriyaṃ sattantarā, [5.2]
Herein, the measurements are: twelve spans by the Buddha's span in length, and seven spans across on the inside.
bhikkhū abhinetabbā vatthudesanāya. [2.9]
Monks must be brought to mark out the site.
Tehi bhikkhūhi vatthuṃ desetabbaṃ anārambhaṃ saparikkamanaṃ. Sārambhe ce bhikkhu vatthusmiṃ aparikkamane [6.9]
By those monks, a site must be marked out that is not involving harm and has an open space around it. If a monk builds a hut on a site involving harm or without an open space around it,
saññācikāya kuṭiṃ kāreyya [2.2]
or having it built by his own begging,
bhikkhū vā anabhineyya vatthudesanāya pamāṇaṃ vā atikkāmeyya saṅghādiseso. [6.2]
or should not bring the monks to mark out the site, or should exceed the measurements, it is a Saṅghādisesa.`
},

{
    id: 'Sg.7', title: 'Saṅghādisesa 7', audio: '2Sg-07.mp3',
    text: `Mahallakaṃ pana bhikkhunā vihāraṃ kārayamānena sassāmikaṃ attuddesaṃ, bhikkhū abhinetabbā vatthudesanāya. [7.7]
A monk who is having a large dwelling built, where there is an owner and which is for himself, must bring monks to mark out the site.
Tehi bhikkhūhi vatthuṃ desetabbaṃ anārambhaṃ saparikkamanaṃ. Sārambhe ce bhikkhu vatthusmiṃ aparikkamane [6.6]
By those monks, a site must be marked out that is not involving harm and has an open space around it. If a monk builds a large dwelling on a site involving harm or without an open space around it,
mahallakaṃ vihāraṃ kāreyya, bhikkhū vā anabhineyya vatthudesanāya, saṅghādiseso. [5.6]
or should not bring the monks to mark out the site, it is a Saṅghādisesa.`
},

{
    id: 'Sg.8', title: 'Saṅghādisesa 8', audio: '2Sg-08.mp3',
    text: `Yo pana bhikkhu bhikkhuṃ duṭṭho doso appatīto amūlakena pārājikena dhammena anuddhaṃseyya [6.3]
Whatever monk, malicious, angry, and displeased, should charge a monk with a groundless Pārājika offense,
“appeva nāma naṃ imamhā brahmacariyā cāveyyan”ti, tato aparena samayena samanuggāhīyamāno vā [6.3]
thinking, "Perhaps I can oust him from this holy life"; and then later, whether he is questioned or
asamanuggāhīyamāno vā amūlakañceva taṃ adhikaraṇaṃ hoti, [4.3]
not questioned, if that legal case is groundless and
bhikkhu ca dosaṃ patiṭṭhāti, saṅghādiseso. [4.4]
the monk admits his malice, it is a Saṅghādisesa.`
},

{
    id: 'Sg.9', title: 'Saṅghādisesa 9', audio: '2Sg-09.mp3',
    text: `Yo pana bhikkhu bhikkhuṃ duṭṭho doso appatīto aññabhāgiyassa adhikaraṇassa kiñcidesaṃ lesamattaṃ upādāya [7.05]
Whatever monk, malicious, angry, and displeased, taking some point or other as a mere pretext in a legal case of a different category,
pārājikena dhammena anuddhaṃseyya [2.6]
should charge a monk with a Pārājika offense,
“appeva nāma naṃ imamhā brahmacariyā cāveyyan”ti, tato aparena samayena [4.9]
thinking, "Perhaps I can oust him from this holy life"; and then later,
samanuggāhīyamāno vā asamanuggāhīyamāno vā [3.5]
whether he is questioned or not questioned,
aññabhāgiyañceva taṃ adhikaraṇaṃ hoti [2.9]
if that legal case is of a different category,
koci deso lesamatto upādinno, bhikkhu ca dosaṃ patiṭṭhāti, saṅghādiseso. [5.8]
the pretext being taken as a point of similarity, and the monk admits his malice, it is a Saṅghādisesa.`
},

{
    id: 'Sg.10', title: 'Saṅghādisesa 10', audio: '2Sg-10.mp3',
    text: `Yo pana bhikkhu samaggassa saṅghassa bhedāya parakkameyya, [3.85]
Whatever monk should strive for a schism in a community that is at peace,
bhedanasaṃvattanikaṃ vā adhikaraṇaṃ samādāya paggayha tiṭṭheyya, [4.4]
or should persist in taking up and supporting a legal case conducive to schism,
so bhikkhu bhikkhūhi evamassa vacanīyo [2.6]
that monk should be spoken to by the monks thus:
“mā āyasmā samaggassa saṅghassa bhedāya parakkami, [3.4]
"Venerable sir, do not strive for a schism in the community that is at peace,
bhedanasaṃvattanikaṃ vā adhikaraṇaṃ samādāya paggayha aṭṭhāsi, [4.4]
nor persist in taking up and supporting a legal case conducive to schism.
sametāyasmā saṅghena, samaggo hi saṅgho [3.4]
Let the venerable sir be at one with the community, for a community that is at peace,
sammodamāno avivadamāno ekuddeso phāsu viharatī”ti, [4.2]
on friendly terms, without dispute, having a single recitation, lives in comfort."
evañca so bhikkhu bhikkhūhi vuccamāno tatheva paggaṇheyya, [3.9]
If that monk, when being spoken to by the monks thus, persists as before,
so bhikkhu bhikkhūhi yāvatatiyaṃ samanubhāsitabbo tassa paṭinissaggāya, [4.5]
that monk should be admonished by the monks up to the third time for the relinquishing of that course.
yāvatatiyañce samanubhāsiyamāno taṃ paṭinissajjeyya, iccetaṃ kusalaṃ, [4.45]
If, being admonished up to the third time, he relinquishes it, that is good.
no ce paṭinissajjeyya, saṅghādiseso. [3.8]
If he does not relinquish it, it is a Saṅghādisesa.`
},

{
    id: 'Sg.11', title: 'Saṅghādisesa 11', audio: '2Sg-11.mp3',
    text: `Tasseva kho pana bhikkhussa bhikkhū honti anuvattakā vaggavādakā eko vā dve vā tayo vā, te evaṃ vadeyyuṃ: [7.1]
If there are monks who are followers of that monk and speak on his behalf, one, two, or three, and they should say:
“mā āyasmanto etaṃ bhikkhuṃ kiñci avacuttha, [3.42]
"Venerable sirs, do not say anything to this monk.
dhammavādī ceso bhikkhu, vinayavādī ceso bhikkhu, amhākañceso bhikkhu [5.2]
This monk speaks according to the Dhamma, this monk speaks according to the Vinaya. He speaks
chandañca ruciñca ādāya voharati, jānāti, no bhāsati, amhākampetaṃ khamatī”ti, [5.6]
taking our desire and preference; he knows and speaks for us, and that is pleasing to us."
te bhikkhū bhikkhūhi evamassu vacanīyā [2.7]
Those monks should be spoken to by the monks thus:
“mā āyasmanto evaṃ avacuttha, [2.5]
"Venerable sirs, do not say such a thing.
na ceso bhikkhu dhammavādī, na ceso bhikkhu vinayavādī, [3.8]
This monk does not speak according to the Dhamma, nor does he speak according to the Vinaya.
mā āyasmantānampi saṅghabhedo ruccittha, [3.2]
May a schism in the community not be pleasing to the venerable sirs either.
sametāyasmantānaṃ saṅghena, [2.5]
Let the venerable sirs be at one with the community,
samaggo hi saṅgho sammodamāno avivadamāno [3.4]
for a community that is at peace, on friendly terms, without dispute,
ekuddeso phāsu viharatī”ti, [2.6]
having a single recitation, lives in comfort."
evañca te bhikkhū bhikkhūhi vuccamānā tatheva paggaṇheyyuṃ, [3.9]
If those monks, when being spoken to by the monks thus, persist as before,
te bhikkhū bhikkhūhi yāvatatiyaṃ samanubhāsitabbā tassa paṭinissaggāya, [4.7]
they should be admonished by the monks up to the third time for the relinquishing of that course.
yāvatatiyañce samanubhāsiyamānā taṃ paṭinissajjeyyuṃ, iccetaṃ kusalaṃ, [4.7]
If, being admonished up to the third time, they relinquish it, that is good.
no ce paṭinissajjeyyuṃ, saṅghādiseso. [3.6]
If they do not relinquish it, it is a Saṅghādisesa.`
},

{
    id: 'Sg.12', title: 'Saṅghādisesa 12', audio: '2Sg-12.mp3',
    text: `Bhikkhu paneva dubbacajātiko hoti uddesapariyāpannesu [4.0]
If a monk is of a difficult nature, being spoken to by the monks according to the Dhamma
sikkhāpadesu bhikkhūhi sahadhammikaṃ vuccamāno [3.3]
concerning the training rules included in the recitation,
attānaṃ avacanīyaṃ karoti [2.4]
makes himself uninstructible, saying:
“mā maṃ āyasmanto kiñci avacuttha [2.9]
"Venerable sirs, do not say anything to me,
kalyāṇaṃ vā pāpakaṃ vā, ahampāyasmante na kiñci vakkhāmi kalyāṇaṃ vā pāpakaṃ vā, [5.9]
whether good or bad. I will not say anything to the venerable sirs, whether good or bad.
viramathāyasmanto mama vacanāyā”ti, [3.1]
Refrain, venerable sirs, from speaking to me."
so bhikkhu bhikkhūhi evamassa vacanīyo [2.7]
That monk should be spoken to by the monks thus:
“mā āyasmā attānaṃ avacanīyaṃ akāsi, vacanīyamevāyasmā attānaṃ karotu, [6.1]
"Venerable sir, do not make yourself uninstructible. Let the venerable sir make himself instructible.
āyasmāpi bhikkhū vadatu sahadhammena, bhikkhūpi āyasmantaṃ vakkhanti sahadhammena, [5.6]
Let the venerable sir speak to the monks according to the Dhamma, and the monks will speak to the venerable sir according to the Dhamma.
evaṃ saṃvaddhā hi tassa bhagavato parisā [3.1]
For in this way has the Blessed One's assembly been grown:
yadidaṃ aññamaññavacanena aññamaññavuṭṭhāpanenā”ti, [4.0]
namely, by mutual speech and mutual rehabilitation."
evañca so bhikkhu bhikkhūhi vuccamāno tatheva paggaṇheyya, [3.7]
If that monk, when being spoken to by the monks thus, persists as before,
so bhikkhu bhikkhūhi yāvatatiyaṃ samanubhāsitabbo tassa paṭinissaggāya, [4.7]
he should be admonished by the monks up to the third time for the relinquishing of that course.
yāvatatiyañce samanubhāsiyamāno taṃ paṭinissajjeyya, iccetaṃ kusalaṃ, [4.6]
If, being admonished up to the third time, he relinquishes it, that is good.
no ce paṭinissajjeyya, saṅghādiseso. [4.0]
If he does not relinquish it, it is a Saṅghādisesa.`
},

{
    id: 'Sg.13', title: 'Saṅghādisesa 13', audio: '2Sg-13.mp3',
    text: `Bhikkhu paneva aññataraṃ gāmaṃ vā nigamaṃ vā upanissāya viharati [4.82]
A monk living in dependence on a certain village or town,
kuladūsako pāpasamācāro, [2.2]
is a corrupter of families and a man of evil conduct.
tassa kho pāpakā samācārā dissanti ceva suyyanti ca, [3.75]
His evil conduct is both seen and heard,
kulāni ca tena duṭṭhāni dissanti ceva suyyanti ca, [3.5]
and the families corrupted by him are both seen and heard.
so bhikkhu bhikkhūhi evamassa vacanīyo [2.75]
That monk should be spoken to by the monks thus:
“āyasmā kho kuladūsako pāpasamācāro, [3.0]
"Venerable sir, you are a corrupter of families and a man of evil conduct.
āyasmato kho pāpakā samācārā dissanti ceva suyyanti ca, [4.2]
Your evil conduct is both seen and heard,
kulāni cāyasmatā duṭṭhāni dissanti ceva suyyanti ca, [3.5]
and the families corrupted by you are both seen and heard.
pakkamatāyasmā imamhā āvāsā, alaṃ te idha vāsenā”ti, [4.6]
Depart, venerable sir, from this residence. You have stayed here long enough."
evañca so bhikkhu bhikkhūhi vuccamāno te bhikkhū evaṃ vadeyya [4.2]
If that monk, when being spoken to by the monks thus, should say to those monks:
“chandagāmino ca bhikkhū, dosagāmino ca bhikkhū, mohagāmino ca bhikkhū, bhayagāmino ca bhikkhū [5.5]
"The monks are biased through favoritism, biased through malice, biased through delusion, and biased through fear.
tādisikāya āpattiyā ekaccaṃ pabbājenti, ekaccaṃ na pabbājentī”ti, [5.0]
For such an offense, they banish some and do not banish others."
so bhikkhu bhikkhūhi evamassa vacanīyo [2.6]
That monk should be spoken to by the monks thus:
“mā āyasmā evaṃ avaca, na ca bhikkhū chandagāmino, na ca bhikkhū dosagāmino, [4.85]
"Venerable sir, do not say such a thing. The monks are not biased through favoritism, malice,
na ca bhikkhū mohagāmino, na ca bhikkhū bhayagāmino, āyasmā kho kuladūsako pāpasamācāro, [6.0]
delusion, or fear. You are a corrupter of families and a man of evil conduct.
āyasmato kho pāpakā samācārā dissanti ceva suyyanti ca, [4.1]
Your evil conduct is both seen and heard,
kulāni cāyasmatā duṭṭhāni dissanti ceva suyyanti ca, [3.5]
and families corrupted by you are both seen and heard.
pakkamatāyasmā imamhā āvāsā, alaṃ te idha vāsenā”ti, [4.8]
Depart, venerable sir, from this residence. You have stayed here long enough."
evañca so bhikkhu bhikkhūhi vuccamāno tatheva paggaṇheyya, [3.9]
If that monk, when being spoken to by the monks thus, persists as before,
so bhikkhu bhikkhūhi yāvatatiyaṃ samanubhāsitabbo tassa paṭinissaggāya, [4.5]
he should be admonished by the monks up to the third time for the relinquishing of that course.
yāvatatiyañce samanubhāsiyamāno taṃ paṭinissajjeyya, iccetaṃ kusalaṃ, [4.4]
If, being admonished up to the third time, he relinquishes it, that is good.
no ce paṭinissajjeyya, saṅghādiseso. [3.6]
If he does not relinquish it, it is a Saṅghādisesa.`
},

{
    id: 'Sg.U', title: 'Saṅghādisesa Uddiṭṭhā', audio: '2Sg-U.mp3',
    text: `Uddiṭṭhā kho āyasmanto terasa saṅghādisesā dhammā [3.7]
Venerable sirs, the thirteen Saṅghādisesa rules have been recited:
nava paṭhamāpattikā, cattāro yāvatatiyakā. [3.1]
nine involving an offense on the first commission, four involving admonition up to the third time.
Yesaṃ bhikkhu aññataraṃ vā aññataraṃ vā āpajjitvā [3.8]
If a monk commits any one of these and
yāvatīhaṃ jānaṃ paṭicchādeti, [2.5]
knowingly conceals it for however many days,
tāvatīhaṃ tena bhikkhunā akāmā parivatthabbaṃ. [3.4]
for that many days, he must undergo probation (Parivāsa) against his will.
Parivutthaparivāsena bhikkhunā uttariṃ chārattaṃ bhikkhumānattāya paṭipajjitabbaṃ, [5.4]
When the probation is finished, he must undergo the Manatta discipline for a further six nights.
ciṇṇamānatto bhikkhu yattha siyā vīsatigaṇo bhikkhusaṅgho, [3.9]
When the Manatta has been practiced, the monk should be rehabilitated in a place where there is a community of at least twenty monks.
tattha so bhikkhu abbhetabbo. [2.5]
There, that monk should be rehabilitated.
Ekenapi ce ūno vīsatigaṇo bhikkhusaṅgho taṃ bhikkhuṃ abbheyya, [4.2]
If a community of monks numbering even one less than twenty should rehabilitate that monk,
so ca bhikkhu anabbhito, te ca bhikkhū gārayhā, ayaṃ tattha sāmīci. [4.8]
the monk is not rehabilitated, and those monks are blameworthy. This is the proper procedure here.
Tatthāyasmante pucchāmi, kaccittha parisuddhā, dutiyampi pucchāmi, kaccittha parisuddhā, [5.5]
In this regard, I ask the venerable sirs: Are you pure in this? A second time I ask: Are you pure?
tatiyampi pucchāmi, kaccittha parisuddhā, [2.6]
A third time I ask: Are you pure?
parisuddhetthāyasmanto, tasmā tuṇhī, evametaṃ dhārayāmīti. [4.9]
You are pure in this, therefore you are silent. Thus do I understand it.
Saṅghādisesuddeso tatiyo [3.6]
The third section, on Community-Initial-and-Subsequent-Meeting, is finished.`
},

{
    id: 'Ay.1', title: 'Aniyata 1', audio: '3Ay-01.mp3',
    text: `Ime kho panāyasmanto dve aniyatā dhammā uddesaṃ āgacchanti. [5.1]
Venerable sirs, these two Indefinite rules come into recitation.
Yo pana bhikkhu mātugāmena saddhiṃ eko ekāya raho paṭicchanne āsane alaṅkammaniye nisajjaṃ kappeyya, [6.7]
Whatever monk should sit in private, on a secluded and suitable seat, alone with a woman,
tamenaṃ saddheyyavacasā upāsikā disvā tiṇṇaṃ dhammānaṃ aññatarena vadeyya [4.7]
and a trustworthy female lay follower, having seen him, should charge him with any one of three rules:
pārājikena vā saṅghādisesena vā pācittiyena vā, [3.4]
either a Pārājika, a Saṅghādisesa, or a Pācittiya;
nisajjaṃ bhikkhu paṭijānamāno tiṇṇaṃ dhammānaṃ aññatarena kāretabbo [4.6]
then the monk, admitting to sitting there, should be dealt with according to any one of the three rules:
pārājikena vā saṅghādisesena vā pācittiyena vā, [3.6]
either a Pārājika, a Saṅghādisesa, or a Pācittiya;
yena vā sā saddheyyavacasā upāsikā vadeyya, tena so bhikkhu kāretabbo, [4.8]
or he should be dealt with according to whichever rule that trustworthy female lay follower described.
ayaṃ dhammo aniyato. [2.7]
This rule is indefinite.`
},

{
    id: 'Ay.2', title: 'Aniyata 2', audio: '3Ay-02.mp3',
    text: `Na heva kho pana paṭicchannaṃ āsanaṃ hoti nālaṅkammaniyaṃ, [4.2]
And if the seat is not secluded and not suitable for sexual intercourse,
alañca kho hoti mātugāmaṃ duṭṭhullāhi vācāhi obhāsituṃ, [4.1]
but is suitable for addressing a woman with lewd words,
yo pana bhikkhu tathārūpe āsane mātugāmena saddhiṃ eko ekāya raho nisajjaṃ kappeyya, [5.9]
whatever monk should sit in such a place, alone with a woman,
tamenaṃ saddheyyavacasā upāsikā disvā dvinnaṃ dhammānaṃ aññatarena vadeyya [4.8]
and a trustworthy female lay follower, having seen him, should charge him with either of two rules:
saṅghādisesena vā pācittiyena vā, [2.5] 
either a Saṅghādisesa or a Pācittiya;
nisajjaṃ bhikkhu paṭijānamāno dvinnaṃ dhammānaṃ aññatarena kāretabbo [4.5] 
then the monk, admitting to sitting there, should be dealt with according to either of the two rules:
saṅghādisesena vā pācittiyena vā, [2.6]
either a Saṅghādisesa or a Pācittiya;
yena vā sā saddheyyavacasā upāsikā vadeyya, tena so bhikkhu kāretabbo, ayampi dhammo aniyato. [7.2]
or he should be dealt with according to whichever rule that trustworthy female lay follower described. This rule also is indefinite.`
},

{
    id: 'Ay.U', title: 'Aniyata Uddiṭṭhā', audio: '3Ay-U.mp3',
    text: `Uddiṭṭhā kho āyasmanto dve aniyatā dhammā. Tatthāyasmante pucchāmi, kaccittha parisuddhā, [6.2]
Venerable sirs, the two Indefinite rules have been recited. In this regard, I ask the venerable sirs: Are you pure in this?
dutiyampi pucchāmi, kaccittha parisuddhā, tatiyampi pucchāmi, kaccittha parisuddhā, [4.5]
A second time I ask: Are you pure? A third time I ask: Are you pure?
parisuddhetthāyasmanto, tasmā tuṇhī, evametaṃ dhārayāmīti. [4.6]
You are pure in this, therefore you are silent. Thus do I understand it.
Aniyatuddeso catuttho [3.0]
The fourth section, on the Indefinite Rules, is finished.`
},

 



{
    id: 'NP.1', title: 'Nissaggiya Pācittiya 1', audio: '4NP-01.mp3',
    text: `Ime kho panāyasmanto tiṃsa nissaggiyā pācittiyā Dhammā uddesaṃ āgacchanti. [5.8]
Venerable sirs, these thirty rules for formal confession with forfeiture come into recitation.
Niṭṭhitacīvarasmiṃ bhikkhunā ubbhatasmiṃ kathine dasāhaparamaṃ atirekacīvaraṃ dhāretabbaṃ, [5.6]
When the robe-making is finished and the Kaṭhina frame is dismantled, an extra robe may be kept for at most ten days.
taṃ atikkāmayato nissaggiyaṃ pācittiyaṃ. [3.5]
For him who exceeds that, it is an offense of confession with forfeiture.`
},

{
    id: 'NP.2', title: 'Nissaggiya Pācittiya 2', audio: '4NP-02.mp3',
    text: `Niṭṭhitacīvarasmiṃ bhikkhunā ubbhatasmiṃ kathine ekarattampi ce bhikkhu ticīvarena vippavaseyya, aññatra bhikkhusammutiyā nissaggiyaṃ pācittiyaṃ. [9.0]
When the robe-making is finished and the Kaṭhina frame is dismantled, if a monk should be away from his set of three robes for even one night—except by the formal agreement of the monks—it is an offense of confession with forfeiture.`
},

{
    id: 'NP.3', title: 'Nissaggiya Pācittiya 3', audio: '4NP-03.mp3',
    text: `Niṭṭhitacīvarasmiṃ bhikkhunā ubbhatasmiṃ kathine bhikkhuno paneva akālacīvaraṃ uppajjeyya, [5.6]
When the robe-making is finished and the Kaṭhina frame is dismantled, if an "out-of-season" robe should accrue to a monk,
ākaṅkhamānena bhikkhunā paṭiggahetabbaṃ, paṭiggahetvā khippameva kāretabbaṃ, [5.0]
it may be accepted by the monk if he so desires. Having accepted it, he should have it made up quickly.
no cassa pāripūri, māsaparamaṃ tena bhikkhunā taṃ cīvaraṃ nikkhipitabbaṃ [4.7]
If it is not enough to make a robe, it may be kept by that monk for at most a month,
ūnassa pāripūriyā satiyā paccāsāya. Tato ce uttariṃ nikkhipeyya satiyāpi paccāsāya, nissaggiyaṃ pācittiyaṃ. [7.0]
in the hope that the deficiency may be made up. If he should keep it longer than that, even if there is hope, it is an offense of confession with forfeiture.`
},

{
    id: 'NP.4', title: 'Nissaggiya Pācittiya 4', audio: '4NP-04.mp3',
    text: `Yo pana bhikkhu aññātikāya bhikkhuniyā purāṇacīvaraṃ dhovāpeyya vā rajāpeyya vā ākoṭāpeyya vā, nissaggiyaṃ pācittiyaṃ. [8.0]
Whatever monk should have an old robe washed, dyed, or beaten by a nun who is not a relative, it is an offense of confession with forfeiture.`
},

{
    id: 'NP.5', title: 'Nissaggiya Pācittiya 5', audio: '4NP-05.mp3',
    text: `Yo pana bhikkhu aññātikāya bhikkhuniyā hatthato cīvaraṃ paṭiggaṇheyya aññatra pārivattakā, nissaggiyaṃ pācittiyaṃ. [8.0]
Whatever monk should accept a robe from the hand of a nun who is not a relative, except in exchange, it is an offense of confession with forfeiture.`
},

{
    id: 'NP.6', title: 'Nissaggiya Pācittiya 6', audio: '4NP-06.mp3',
    text: `Yo pana bhikkhu aññātakaṃ gahapatiṃ vā gahapatāniṃ vā cīvaraṃ viññāpeyya [4.8]
Whatever monk should ask for a robe from a male or female householder who is not a relative,
aññatra samayā, nissaggiyaṃ pācittiyaṃ. [2.6]
except at the proper time, it is an offense of confession with forfeiture.
Tatthāyaṃ samayo: acchinnacīvaro vā hoti bhikkhu, naṭṭhacīvaro vā, ayaṃ tattha samayo. [6.5]
Here, the proper time is when a monk's robe has been stolen or lost. This is the proper time in this case.`
},

{
    id: 'NP.7', title: 'Nissaggiya Pācittiya 7', audio: '4NP-07.mp3',
    text: `Tañce aññātako gahapati vā gahapatānī vā bahūhi cīvarehi abhihaṭṭhuṃ pavāreyya, [5.9]
If a male or female householder who is not a relative should offer to provide many robes,
santaruttaraparamaṃ tena bhikkhunā tato cīvaraṃ sāditabbaṃ. Tato ce uttariṃ sādiyeyya, nissaggiyaṃ pācittiyaṃ. [7.0]
then at most an upper and a lower robe should be accepted by that monk. If he should accept more than that, it is an offense of confession with forfeiture.`
},

{
    id: 'NP.8', title: 'Nissaggiya Pācittiya 8', audio: '4NP-08.mp3',
    text: `Bhikkhuṃ paneva uddissa aññātakassa gahapatissa vā gahapatāniyā vā cīvaracetāpannaṃ upakkhaṭaṃ hoti [6.6]
If a robe-fund has been set aside for a monk by a male or female householder who is not a relative,
“iminā cīvaracetāpannena cīvaraṃ cetāpetvā itthannāmaṃ bhikkhuṃ cīvarena acchādessāmī”ti, [7.0]
thinking, "With this robe-fund I will buy a robe and present it to such-and-such a monk";
tatra ce so bhikkhu pubbe appavārito upasaṅkamitvā cīvare vikappaṃ āpajjeyya [5.5]
if that monk, without being previously invited, goes and makes a specific request regarding the robe,
“sādhu vata maṃ āyasmā iminā cīvaracetāpannena [3.4]
saying, "It would be good indeed if you would buy such-and-such a robe with this fund
evarūpaṃ vā evarūpaṃ vā cīvaraṃ cetāpetvā acchādehī”ti [4.6]
and present it to me," out of a desire for something fine,
kalyāṇakamyataṃ upādāya, nissaggiyaṃ pācittiyaṃ. [4.0]
it is an offense of confession with forfeiture.`
},

{
    id: 'NP.9', title: 'Nissaggiya Pācittiya 9', audio: '4NP-09.mp3',
    text: `Bhikkhuṃ paneva uddissa ubhinnaṃ aññātakānaṃ gahapatīnaṃ vā gahapatānīnaṃ vā paccekacīvaracetāpannāni upakkhaṭāni honti [8.2]
If separate robe-funds have been set aside for a monk by two male or female householders who are not relatives,
“imehi mayaṃ paccekacīvaracetāpannehi paccekacīvarāni cetāpetvā itthannāmaṃ bhikkhuṃ [5.9]
thinking, "With these separate robe-funds we will buy separate robes and present them
cīvarehi acchādessāmā”ti, [2.3]
to such-and-such a monk";
tatra ce so bhikkhu pubbe appavārito upasaṅkamitvā [3.8]
if that monk, without being previously invited, goes and
cīvare vikappaṃ āpajjeyya [2.1]
makes a specific request regarding the robes,
“sādhu vata maṃ āyasmanto imehi paccekacīvaracetāpannehi evarūpaṃ vā evarūpaṃ vā cīvaraṃ cetāpetvā [6.8]
saying, "It would be good indeed if you would buy a robe like this with these funds,
acchādetha ubhova santā ekenā”ti kalyāṇakamyataṃ upādāya, nissaggiyaṃ pācittiyaṃ. [7.0]
having both funds provide a single robe," out of a desire for something fine, it is an offense of confession with forfeiture.`
},

{
    id: 'NP.10', title: 'Nissaggiya Pācittiya 10', audio: '4NP-10.mp3',
    text: `Bhikkhuṃ paneva uddissa rājā vā rājabhoggo vā brāhmaṇo vā gahapatiko vā dūtena cīvaracetāpannaṃ pahiṇeyya [7.1]
If a king, a royal official, a brahmin, or a householder should send a robe-fund for a monk by a messenger,
“iminā cīvaracetāpannena cīvaraṃ cetāpetvā itthannāmaṃ bhikkhuṃ cīvarena acchādehī”ti. [6.1]
saying, "With this robe-fund, buy a robe and present it to such-and-such a monk."
So ce dūto taṃ bhikkhuṃ upasaṅkamitvā evaṃ vadeyya [3.8]
If that messenger, having approached the monk, should say:
“idaṃ kho, bhante, āyasmantaṃ uddissa cīvaracetāpannaṃ ābhataṃ, [4.6]
"Venerable sir, this robe-fund has been brought for you;
paṭiggaṇhātu āyasmā cīvaracetāpanna”nti. [3.3]
may the venerable sir accept it."
Tena bhikkhunā so dūto evamassa vacanīyo [2.9]
The messenger should be spoken to by that monk thus:
“na kho mayaṃ, āvuso, cīvaracetāpannaṃ paṭiggaṇhāma, [3.6]
"Friend, we do not accept robe-funds.
cīvarañca kho mayaṃ paṭiggaṇhāma kālena kappiya”nti. [3.4]
But we accept a robe when it is at the proper time and allowable."
So ce dūto taṃ bhikkhuṃ evaṃ vadeyya “atthi panāyasmato koci veyyāvaccakaro”ti. [5.3]
If the messenger should say to the monk, "Is there anyone who is the venerable sir's attendant?"
Cīvaratthikena, bhikkhave, bhikkhunā veyyāvaccakaro niddisitabbo [4.1]
Monks, the monk who needs a robe should point out an attendant,
ārāmiko vā upāsako vā “eso kho, āvuso, bhikkhūnaṃ veyyāvaccakaro”ti. [5.2]
either a monastery worker or a lay follower, saying, "Friend, this person is the monks' attendant."
So ce dūto taṃ veyyāvaccakaraṃ saññāpetvā taṃ bhikkhuṃ upasaṅkamitvā evaṃ vadeyya [5.4]
If the messenger, having informed the attendant and approached the monk, should say:
“yaṃ kho, bhante, āyasmā veyyāvaccakaraṃ niddisi, saññatto so mayā, [4.8]
"Venerable sir, that attendant you pointed out has been informed by me.
upasaṅkamatāyasmā kālena, cīvarena taṃ acchādessatī”ti. [4.4]
Approach him at the proper time and he will provide you with a robe."
Cīvaratthikena, bhikkhave, bhikkhunā veyyāvaccakaro upasaṅkamitvā dvattikkhattuṃ codetabbo sāretabbo [6.5]
The monk who needs a robe, having approached the attendant, should urge him or remind him two or three times,
“attho me, āvuso, cīvarenā”ti, [2.6]
saying, "Friend, I need a robe."
dvattikkhattuṃ codayamāno sārayamāno taṃ cīvaraṃ abhinipphādeyya, iccetaṃ kusalaṃ, [5.5]
If, urging and reminding him two or three times, he obtains the robe, that is good.
no ce abhinipphādeyya, catukkhattuṃ pañcakkhattuṃ chakkhattuparamaṃ tuṇhībhūtena uddissa ṭhātabbaṃ, [6.1]
If he does not obtain it, he should stand in silence for the purpose four, five, or at most six times.
catukkhattuṃ pañcakkhattuṃ chakkhattuparamaṃ tuṇhībhūto uddissa tiṭṭhamāno taṃ cīvaraṃ abhinipphādeyya, [6.3]
If, standing in silence four, five, or at most six times, he obtains the robe,
iccetaṃ kusalaṃ, [1.5]
that is good.
tato ce uttari vāyamamāno taṃ cīvaraṃ abhinipphādeyya, nissaggiyaṃ pācittiyaṃ. [5.2]
If, striving further than that, he obtains the robe, it is an offense of confession with forfeiture.
No ce abhinipphādeyya, yatassa cīvaracetāpannaṃ ābhataṃ, tattha sāmaṃ vā gantabbaṃ, dūto vā pāhetabbo [7.1]
If he does not obtain it, then he must either go himself or send a messenger to where the robe-fund was brought from,
“yaṃ kho tumhe āyasmanto bhikkhuṃ uddissa cīvaracetāpannaṃ pahiṇittha, [4.9]
to say: "Venerable sirs, that robe-fund you sent for the monk
na taṃ tassa bhikkhuno kiñci atthaṃ anubhoti, [3.1]
has not benefited that monk at all.
yuñjantāyasmanto sakaṃ, mā vo sakaṃ vinassā”ti, ayaṃ tattha sāmīci. [4.9]
Make use of your own property; let your own property not be lost." This is the proper procedure here.
Cīvaravaggo paṭhamo [2.6]
The first chapter, on Robes.`
},

{
    id: 'NP.11', title: 'Nissaggiya Pācittiya 11', audio: '4NP-11.mp3',
    text: `Yo pana bhikkhu kosiyamissakaṃ santhataṃ kārāpeyya, nissaggiyaṃ pācittiyaṃ. [5.3]
Whatever monk should have a rug made mixed with silk, it is an offense of confession with forfeiture.`
},

{
    id: 'NP.12', title: 'Nissaggiya Pācittiya 12', audio: '4NP-12.mp3',
    text: `Yo pana bhikkhu suddhakāḷakānaṃ eḷakalomānaṃ santhataṃ kārāpeyya, nissaggiyaṃ pācittiyaṃ. [6.0]
Whatever monk should have a rug made of pure black wool, it is an offense of confession with forfeiture.`
},

{
    id: 'NP.13', title: 'Nissaggiya Pācittiya 13', audio: '4NP-13.mp3',
    text: `Navaṃ pana bhikkhunā santhataṃ kārayamānena dve bhāgā suddhakāḷakānaṃ eḷakalomānaṃ ādātabbā, [6.3]
A monk having a new rug made should take two parts of pure black wool,
tatiyaṃ odātānaṃ, catutthaṃ gocariyānaṃ. [2.9]
a third part white wool, and a fourth part brown wool.
Anādā ce bhikkhu dve bhāge suddhakāḷakānaṃ eḷakalomānaṃ, tatiyaṃ odātānaṃ, catutthaṃ gocariyānaṃ, [6.4]
If a monk, without taking two parts pure black, a third part white, and a fourth part brown,
navaṃ santhataṃ kārāpeyya, nissaggiyaṃ pācittiyaṃ. [3.8]
should have a new rug made, it is an offense of confession with forfeiture.`
},

{
    id: 'NP.14', title: 'Nissaggiya Pācittiya 14', audio: '4NP-14.mp3',
    text: `Navaṃ pana bhikkhunā santhataṃ kārāpetvā chabbassāni dhāretabbaṃ, [4.3]
When a monk has had a new rug made, it must be kept for six years.
orena ce channaṃ vassānaṃ taṃ santhataṃ vissajjetvā vā avissajjetvā vā aññaṃ navaṃ santhataṃ kārāpeyya [6.5]
If, within less than six years, whether he has given that rug away or not, he should have another new rug made,
aññatra bhikkhusammutiyā, nissaggiyaṃ pācittiyaṃ. [4.0]
except by the formal agreement of the monks, it is an offense of confession with forfeiture.`
},

{
    id: 'NP.15', title: 'Nissaggiya Pācittiya 15', audio: '4NP-15.mp3',
    text: `Nisīdanasanthataṃ pana bhikkhunā kārayamānena purāṇasanthatassa sāmantā sugatavidatthi ādātabbā dubbaṇṇakaraṇāya. [7.1]
When a sitting-mat is being made for a monk, a piece the size of a Buddha's span from an old rug should be taken and incorporated to mar its appearance.
Anādā ce bhikkhu purāṇasanthatassa sāmantā sugatavidatthiṃ, navaṃ nisīdanasanthataṃ kārāpeyya, nissaggiyaṃ pācittiyaṃ. [7.5]
If a monk, without taking a piece the size of a Buddha's span from an old rug, should have a new sitting-mat made, it is an offense of confession with forfeiture.`
},

{
    id: 'NP.16', title: 'Nissaggiya Pācittiya 16', audio: '4NP-16.mp3',
    text: `Bhikkhuno paneva addhānamaggappaṭipannassa eḷakalomāni uppajjeyyuṃ, [4.2]
If wool should accrue to a monk traveling on a journey,
ākaṅkhamānena bhikkhunā paṭiggahetabbāni, paṭiggahetvā tiyojanaparamaṃ sahatthā haritabbāni asante hārake. [6.6]
it may be accepted by the monk if he so desires. Having accepted it, he may carry it with his own hands for at most three leagues if there is no one to carry it.
Tato ce uttariṃ hareyya, asantepi hārake, nissaggiyaṃ pācittiyaṃ. [4.5]
If he should carry it further than that, even if there is no one to carry it, it is an offense of confession with forfeiture.`
},

{
    id: 'NP.17', title: 'Nissaggiya Pācittiya 17', audio: '4NP-17.mp3',
    text: `Yo pana bhikkhu aññātikāya bhikkhuniyā eḷakalomāni dhovāpeyya vā rajāpeyya vā vijaṭāpeyya vā, nissaggiyaṃ pācittiyaṃ. [7.3]
Whatever monk should have wool washed, dyed, or carded by a nun who is not a relative, it is an offense of confession with forfeiture.`
},

{
    id: 'NP.18', title: 'Nissaggiya Pācittiya 18', audio: '4NP-18.mp3',
    text: `Yo pana bhikkhu jātarūparajataṃ uggaṇheyya vā uggaṇhāpeyya vā upanikkhittaṃ vā sādiyeyya, nissaggiyaṃ pācittiyaṃ. [7.0]
Whatever monk should pick up gold or silver, or have it picked up, or consent to it being set aside for him, it is an offense of confession with forfeiture.`
},

{
    id: 'NP.19', title: 'Nissaggiya Pācittiya 19', audio: '4NP-19.mp3',
    text: `Yo pana bhikkhu nānappakārakaṃ rūpiyasaṃvohāraṃ samāpajjeyya, nissaggiyaṃ pācittiyaṃ. [5.6]
Whatever monk should engage in various kinds of monetary exchange, it is an offense of confession with forfeiture.`
},

{
    id: 'NP.20', title: 'Nissaggiya Pācittiya 20', audio: '4NP-20.mp3',
    text: `Yo pana bhikkhu nānappakārakaṃ kayavikkayaṃ samāpajjeyya, nissaggiyaṃ pācittiyaṃ. Kosiyavaggo dutiyo. [7.0]
Whatever monk should engage in various kinds of buying and selling, it is an offense of confession with forfeiture. The second chapter, on Silk.`
},

{
    id: 'NP.21', title: 'Nissaggiya Pācittiya 21', audio: '4NP-21.mp3',
    text: `Dasāhaparamaṃ atirekapatto dhāretabbo, taṃ atikkāmayato nissaggiyaṃ pācittiyaṃ. [6.0]
An extra bowl may be kept for at most ten days. For him who exceeds that, it is an offense of confession with forfeiture.`
},

{
    id: 'NP.22', title: 'Nissaggiya Pācittiya 22', audio: '4NP-22.mp3',
    text: `Yo pana bhikkhu ūnapañcabandhanena pattena aññaṃ navaṃ pattaṃ cetāpeyya, nissaggiyaṃ pācittiyaṃ. [5.6]
Whatever monk should exchange his bowl that has fewer than five mended cracks for another new bowl, it is an offense of confession with forfeiture.
Tena bhikkhunā so patto bhikkhuparisāya nissajjitabbo, yo ca tassā bhikkhuparisāya pattapariyanto, [5.7]
That bowl must be forfeited by that monk to the assembly of monks. And whichever is the last bowl in that assembly
so tassa bhikkhuno padātabbo “ayaṃ te bhikkhu patto yāva bhedanāya dhāretabbo”ti, ayaṃ tattha sāmīci. [6.6]
should be given to that monk with the words: "Monk, this is your bowl; it is to be kept until it breaks." This is the proper procedure here.`
},

{
    id: 'NP.23', title: 'Nissaggiya Pācittiya 23', audio: '4NP-23.mp3',
    text: `Yāni kho pana tāni gilānānaṃ bhikkhūnaṃ paṭisāyanīyāni bhesajjāni, seyyathidaṃ – [5.8]
Those medicines which may be consumed by sick monks, namely:
sappi navanītaṃ telaṃ madhu phāṇitaṃ, tāni paṭiggahetvā sattāhaparamaṃ sannidhikārakaṃ paribhuñjitabbāni, [6.1]
ghee, fresh butter, oil, honey, and molasses; having been accepted, they may be stored and consumed for at most seven days.
taṃ atikkāmayato nissaggiyaṃ pācittiyaṃ. [3.0]
For him who exceeds that, it is an offense of confession with forfeiture.`
},

{
    id: 'NP.24', title: 'Nissaggiya Pācittiya 24', audio: '4NP-24.mp3',
    text: `“Māso seso gimhānan”ti bhikkhunā vassikasāṭikacīvaraṃ pariyesitabbaṃ, [4.45]
When one month of the hot season remains, a monk should search for a rains-residence cloth.
“addhamāso seso gimhānan”ti katvā nivāsetabbaṃ. Orena ce “māso seso gimhānan”ti [5.2]
When half a month remains, he should have it made and wear it. If, more than a month before the end of the hot season,
vassikasāṭikacīvaraṃ pariyeseyya, orena"ddhamāso seso gimhānan”ti katvā nivāseyya, [4.9]
he should search for a rains-residence cloth, or more than half a month before, he should have it made and wear it,
nissaggiyaṃ pācittiyaṃ. [2.6]
it is an offense of confession with forfeiture.`
},

{
    id: 'NP.25', title: 'Nissaggiya Pācittiya 25', audio: '4NP-25.mp3',
    text: `Yo pana bhikkhu bhikkhussa sāmaṃ cīvaraṃ datvā kupito anattamano acchindeyya vā acchindāpeyya vā, nissaggiyaṃ pācittiyaṃ. [7.5]
Whatever monk, having himself given a robe to another monk, should, being angry and displeased, take it back or have it taken back, it is an offense of confession with forfeiture.`
},

{
    id: 'NP.26', title: 'Nissaggiya Pācittiya 26', audio: '4NP-26.mp3',
    text: `Yo pana bhikkhu sāmaṃ suttaṃ viññāpetvā tantavāyehi cīvaraṃ vāyāpeyya, nissaggiyaṃ pācittiyaṃ. [6.0]
Whatever monk, having himself asked for yarn, should have a robe woven by weavers, it is an offense of confession with forfeiture.`
},

{
    id: 'NP.27', title: 'Nissaggiya Pācittiya 27', audio: '4NP-27.mp3',
    text: `Bhikkhuṃ paneva uddissa aññātako gahapati vā gahapatānī vā tantavāyehi cīvaraṃ vāyāpeyya, [5.5]
If a male or female householder who is not a relative should have a robe woven by weavers for a monk,
tatra ce so bhikkhu pubbe appavārito tantavāye upasaṅkamitvā cīvare vikappaṃ āpajjeyya [5.6]
and if that monk, without being previously invited, approaches the weavers and makes a specific request regarding the robe,
“idaṃ kho, āvuso, cīvaraṃ maṃ uddissa viyyati, [2.9]
saying, "Friend, this robe is being woven for me.
āyatañca karotha, vitthatañca, appitañca, suvītañca, suppavāyitañca, suvilekhitañca, suvitacchitañca karotha, [6.2]
Make it long, make it wide, make it thick, make it well-woven, well-distributed, well-combed, and well-shorn.
appeva nāma mayampi āyasmantānaṃ kiñcimattaṃ anupadajjeyyāmā”ti. [4.5]
Perhaps I may give the venerable sirs something as a reward."
Evañca so bhikkhu vatvā kiñcimattaṃ anupadajjeyya antamaso piṇḍapātamattampi, nissaggiyaṃ pācittiyaṃ. [6.7]
If the monk, having spoken thus, should give something, even as little as alms-food, it is an offense of confession with forfeiture.`
},

{
    id: 'NP.28', title: 'Nissaggiya Pācittiya 28', audio: '4NP-28.mp3',
    text: `Dasāhānāgataṃ kattikatemāsikapuṇṇamaṃ bhikkhuno paneva accekacīvaraṃ uppajjeyya, [5.9]
If an "urgent" robe should accrue to a monk ten days before the full moon of the three-month Kattika period,
accekaṃ maññamānena bhikkhunā paṭiggahetabbaṃ, paṭiggahetvā yāva cīvarakālasamayaṃ nikkhipitabbaṃ. [5.7]
it may be accepted by the monk, recognizing it as urgent. Having accepted it, he may keep it until the robe-time.
Tato ce uttari nikkhipeyya, nissaggiyaṃ pācittiyaṃ. [3.5]
If he should keep it longer than that, it is an offense of confession with forfeiture.`
},

{
    id: 'NP.29', title: 'Nissaggiya Pācittiya 29', audio: '4NP-29.mp3',
    text: `Upavassaṃ kho pana kattikapuṇṇamaṃ yāni kho pana tāni āraññakāni senāsanāni sāsaṅkasammatāni sappaṭibhayāni, [6.7]
Having completed the Kattika full moon, if a monk is living in such forest dwellings as are considered dangerous and frightening,
tathārūpesu bhikkhu senāsanesu viharanto ākaṅkhamāno [3.8]
he may, if he so desires, store one of his three robes in an inhabited area.
tiṇṇaṃ cīvarānaṃ aññataraṃ cīvaraṃ antaraghare nikkhipeyya, [3.4]
Should there be any reason for that monk to be away from that robe,
siyā ca tassa bhikkhuno kocideva paccayo tena cīvarena vippavāsāya, [4.1]
he may be away from that robe for at most six nights.
chārattaparamaṃ tena bhikkhunā tena cīvarena vippavasitabbaṃ. [3.4]
If he should be away from it longer than that, except by the formal agreement of the monks,
Tato ce uttariṃ vippavaseyya aññatra bhikkhusammutiyā, nissaggiyaṃ pācittiyaṃ. [4.9]
it is an offense of confession with forfeiture.`
},

{
    id: 'NP.30', title: 'Nissaggiya Pācittiya 30', audio: '4NP-30.mp3',
    text: `Yo pana bhikkhu jānaṃ saṅghikaṃ lābhaṃ pariṇataṃ attano pariṇāmeyya, nissaggiyaṃ pācittiyaṃ. [5.2]
Whatever monk should knowingly divert to himself gains intended for the community, it is an offense of confession with forfeiture.
Pattavaggo tatiyo. [2.5]
The third chapter, on Bowls.`
},

{
    id: 'NP.U', title: 'Nissaggiya Uddiṭṭhā', audio: '4NP-U.mp3',
    text: `Uddiṭṭhā kho āyasmanto tiṃsa nissaggiyā pācittiyā dhammā. Tatthāyasmante pucchāmi, kaccittha parisuddhā, [6.6]
Venerable sirs, the thirty rules for confession with forfeiture have been recited. In this regard, I ask the venerable sirs: Are you pure in this?
dutiyampi pucchāmi, kaccittha parisuddhā, tatiyampi pucchāmi, kaccittha parisuddhā, [4.0]
A second time I ask: Are you pure? A third time I ask: Are you pure?
parisuddhetthāyasmanto, tasmā tuṇhī, evametaṃ dhārayāmīti. [4.3]
You are pure in this, therefore you are silent. Thus do I understand it.
Nissaggiyapācittiyā niṭṭhitā [2.9]
The section on Confession with Forfeiture is finished.`
},



 
{
    id: 'Pc.1-3', title: 'Pācittiya 1-3', audio: '5Pc-01-03.mp3',
    text: `Ime kho panāyasmanto dvenavuti pācittiyā Dhammā uddesaṃ āgacchanti. [4.8]
Venerable sirs, these ninety-two rules for formal confession come into recitation.
Sampajānamusāvāde pācittiyaṃ. Omasavāde pācittiyaṃ. Bhikkhupesuññe pācittiyaṃ. [5.5]
For deliberate lying, there is an offense of confession. For insulting speech, there is an offense of confession. For backbiting among monks, there is an offense of confession.`
},

{
    id: 'Pc.4', title: 'Pācittiya 4', audio: '5Pc-04.mp3',
    text: `Yo pana bhikkhu anupasampannaṃ padaso dhammaṃ vāceyya, pācittiyaṃ. [4.3]
Whatever monk should teach the Dhamma word-for-word to one who is not ordained, it is an offense of confession.`
},

{
    id: 'Pc.5', title: 'Pācittiya 5', audio: '5Pc-05.mp3',
    text: `Yo pana bhikkhu anupasampannena uttariṃ dirattatirattaṃ sahaseyyaṃ kappeyya, pācittiyaṃ. [5.2]
Whatever monk should lie down to sleep in the same place with one who is not ordained for more than two or three nights, it is an offense of confession.`
},

{
    id: 'Pc.6', title: 'Pācittiya 6', audio: '5Pc-06.mp3',
    text: `Yo pana bhikkhu mātugāmena sahaseyyaṃ kappeyya, pācittiyaṃ. [4.0]
Whatever monk should lie down to sleep in the same place with a woman, it is an offense of confession.`
},

{
    id: 'Pc.7', title: 'Pācittiya 7', audio: '5Pc-07.mp3',
    text: `Yo pana bhikkhu mātugāmassa uttariṃ chappañcavācāhi dhammaṃ deseyya aññatra viññunā purisaviggahena, pācittiyaṃ. [7.0]
Whatever monk should teach more than five or six words of Dhamma to a woman, except in the presence of a knowledgeable man, it is an offense of confession.`
},

{
    id: 'Pc.8', title: 'Pācittiya 8', audio: '5Pc-08.mp3',
    text: `Yo pana bhikkhu anupasampannassa uttarimanussadhammaṃ āroceyya, bhūtasmiṃ pācittiyaṃ. [5.5]
Whatever monk should report a superior human state to one who is not ordained—if it is true—it is an offense of confession.`
},

{
    id: 'Pc.9', title: 'Pācittiya 9', audio: '5Pc-09.mp3',
    text: `Yo pana bhikkhu bhikkhussa duṭṭhullaṃ āpattiṃ anupasampannassa āroceyya aññatra bhikkhusammutiyā, pācittiyaṃ. [6.5]
Whatever monk should report a monk’s serious offense to one who is not ordained—except by the formal agreement of the monks—it is an offense of confession.`
},

{
    id: 'Pc.10', title: 'Pācittiya 10', audio: '5Pc-10.mp3',
    text: `Yo pana bhikkhu pathaviṃ khaṇeyya vā khaṇāpeyya vā pācittiyaṃ. Musāvādavaggo paṭhamo. [5.8]
Whatever monk should dig the soil or have it dug, it is an offense of confession. The first chapter, on Lying.`
},

{
    id: 'Pc.11-13', title: 'Pācittiya 11-13', audio: '5Pc-11-13.mp3',
    text: `Bhūtagāmapātabyatāya pācittiyaṃ. Aññavādake vihesake pācittiyaṃ. Ujjhāpanake khiyyanake pācittiyaṃ. [6.8]
For the destruction of vegetation, there is an offense of confession. For evasive speech and causing frustration, there is an offense of confession. For complaining and grumbling (about a community official), there is an offense of confession.`
},

{
    id: 'Pc.14', title: 'Pācittiya 14', audio: '5Pc-14.mp3',
    text: `Yo pana bhikkhu saṅghikaṃ mañcaṃ vā pīṭhaṃ vā bhisiṃ vā kocchaṃ vā ajjhokāse santharitvā vā santharāpetvā vā [6.7]
Whatever monk, having set out or having had set out in the open air a bed, bench, mattress, or stool belonging to the community,
taṃ pakkamanto neva uddhareyya, na uddharāpeyya, anāpucchaṃ vā gaccheyya, pācittiyaṃ. [4.9]
when departing, should neither put it away nor have it put away, or should go away without asking permission, it is an offense of confession.`
},

{
    id: 'Pc.15', title: 'Pācittiya 15', audio: '5Pc-15.mp3',
    text: `Yo pana bhikkhu saṅghike vihāre seyyaṃ santharitvā vā santharāpetvā vā [4.6]
Whatever monk, having set out or having had set out bedding in a dwelling belonging to the community,
taṃ pakkamanto neva uddhareyya, na uddharāpeyya, anāpucchaṃ vā gaccheyya, pācittiyaṃ. [5.0]
when departing, should neither put it away nor have it put away, or should go away without asking permission, it is an offense of confession.`
},

{
    id: 'Pc.16', title: 'Pācittiya 16', audio: '5Pc-16.mp3',
    text: `Yo pana bhikkhu saṅghike vihāre jānaṃ pubbupagataṃ bhikkhuṃ anupakhajja seyyaṃ kappeyya [4.9]
Whatever monk, in a dwelling belonging to the community, should knowingly lie down to sleep crowding a monk who arrived first,
“yassa sambādho bhavissati, so pakkamissatī”ti [2.9]
thinking, "Whoever is crowded will leave,"
etadeva paccayaṃ karitvā anaññaṃ, pācittiyaṃ. [3.6]
making this the only reason and no other, it is an offense of confession.`
},

{
    id: 'Pc.17', title: 'Pācittiya 17', audio: '5Pc-17.mp3',
    text: `Yo pana bhikkhu bhikkhuṃ kupito anattamano saṅghikā vihārā nikkaḍḍheyya vā nikkaḍḍhāpeyya vā, pācittiyaṃ. [6.5]
Whatever monk, being angry and displeased, should drive a monk out or have him driven out from a dwelling belonging to the community, it is an offense of confession.`
},

{
    id: 'Pc.18', title: 'Pācittiya 18', audio: '5Pc-18.mp3',
    text: `Yo pana bhikkhu saṅghike vihāre uparivehāsakuṭiyā āhaccapādakaṃ [4.2]
Whatever monk, in a dwelling belonging to the community, on an upper floor,
mañcaṃ vā pīṭhaṃ vā abhinisīdeyya vā abhinipajjeyya vā, pācittiyaṃ. [4.5]
should sit or lie down on a bed or bench with detachable legs, it is an offense of confession.`
},

{
    id: 'Pc.19', title: 'Pācittiya 19', audio: '5Pc-19.mp3',
    text: `Mahallakaṃ pana bhikkhunā vihāraṃ kārayamānena yāva dvārakosā aggaḷaṭṭhapanāya [5.2]
When a monk is having a large dwelling built, he may supervise the application of at most two or three layers of roofing/plastering,
ālokasandhiparikammāya dvatticchadanassa pariyāyaṃ appaharite ṭhitena adhiṭṭhātabbaṃ, [5.1]
standing where there are no crops, to secure the door-frames and finish the window openings.
tato ce uttariṃ appaharitepi ṭhito adhiṭṭhaheyya, pācittiyaṃ. [4.0]
If he should supervise more than that, even standing where there are no crops, it is an offense of confession.`
},

{
    id: 'Pc.20', title: 'Pācittiya 20', audio: '5Pc-20.mp3',
    text: `Yo pana bhikkhu jānaṃ sappāṇakaṃ udakaṃ tiṇaṃ vā mattikaṃ vā siñceyya vā siñcāpeyya vā, pācittiyaṃ. [5.8]
Whatever monk should knowingly pour water containing living beings on grass or clay, or have it poured, it is an offense of confession.
Bhūtagāmavaggo dutiyo. [2.5]
The second chapter, on Vegetation.`
},

{
    id: 'Pc.21', title: 'Pācittiya 21', audio: '5Pc-21.mp3',
    text: `Yo pana bhikkhu asammato bhikkhuniyo ovadeyya, pācittiyaṃ. [4.5]
Whatever monk, not having been authorized, should teach the nuns, it is an offense of confession.`
},

{
    id: 'Pc.22', title: 'Pācittiya 22', audio: '5Pc-22.mp3',
    text: `Sammatopi ce bhikkhu atthaṅgate sūriye bhikkhuniyo ovadeyya, pācittiyaṃ. [4.7]
Even if a monk has been authorized, if he should teach the nuns after the sun has set, it is an offense of confession.`
},

{
    id: 'Pc.23', title: 'Pācittiya 23', audio: '5Pc-23.mp3',
    text: `Yo pana bhikkhu bhikkhunupassayaṃ upasaṅkamitvā bhikkhuniyo ovadeyya [3.8]
Whatever monk, having gone to the nuns' quarters, should teach the nuns,
aññatra samayā, pācittiyaṃ. Tatthāyaṃ samayo, gilānā hoti bhikkhunī, ayaṃ tattha samayo. [5.5]
except at the proper time, it is an offense of confession. Here, the proper time is when a nun is ill. This is the proper time.`
},

{
    id: 'Pc.24', title: 'Pācittiya 24', audio: '5Pc-24.mp3',
    text: `Yo pana bhikkhu evaṃ vadeyya “āmisahetu bhikkhū bhikkhuniyo ovadantī”ti, pācittiyaṃ. [5.5]
Whatever monk should say, "The monks teaches the nuns for the sake of material gain," it is an offense of confession.`
},

{
    id: 'Pc.25', title: 'Pācittiya 25', audio: '5Pc-25.mp3',
    text: `Yo pana bhikkhu aññātikāya bhikkhuniyā cīvaraṃ dadeyya aññatra pārivattakā, pācittiyaṃ. [5.7]
Whatever monk should give a robe to a nun who is not a relative, except in exchange, it is an offense of confession.`
},

{
    id: 'Pc.26', title: 'Pācittiya 26', audio: '5Pc-26.mp3',
    text: `Yo pana bhikkhu aññātikāya bhikkhuniyā cīvaraṃ sibbeyya vā sibbāpeyya vā, pācittiyaṃ. [5.7]
Whatever monk should sew a robe for a nun who is not a relative, or have it sewn, it is an offense of confession.`
},

{
    id: 'Pc.27', title: 'Pācittiya 27', audio: '5Pc-27.mp3',
    text: `Yo pana bhikkhu bhikkhuniyā saddhiṃ saṃvidhāya ekaddhānamaggaṃ paṭipajjeyya [4.4]
Whatever monk, by arrangement, should travel along the same path with a nun,
antamaso gāmantarampi aññatra samayā, pācittiyaṃ. [3.3]
even as far as the next village, except at the proper time, it is an offense of confession.
Tatthāyaṃ samayo, satthagamanīyo hoti maggo, sāsaṅkasammato, sappaṭibhayo, [4.7]
Here, the proper time is when the path is to be traveled with a caravan and is considered dangerous and frightening;
ayaṃ tattha samayo. [2.3]
this is the proper time.`
},

{
    id: 'Pc.28', title: 'Pācittiya 28', audio: '5Pc-28.mp3',
    text: `Yo pana bhikkhu bhikkhuniyā saddhiṃ saṃvidhāya ekaṃ nāvaṃ abhiruheyya [4.4]
Whatever monk, by arrangement, should board the same boat with a nun,
uddhaṅgāminiṃ vā adhogāminiṃ vā aññatra tiriyaṃ taraṇāya, pācittiyaṃ. [4.8]
going either upstream or downstream, except for crossing over, it is an offense of confession.`
},

{
    id: 'Pc.29', title: 'Pācittiya 29', audio: '5Pc-29.mp3',
    text: `Yo pana bhikkhu jānaṃ bhikkhuniparipācitaṃ piṇḍapātaṃ bhuñjeyya aññatra pubbe gihisamārambhā, pācittiyaṃ. [7.1]
Whatever monk should knowingly eat alms-food whose preparation was prompted by a nun, except if the laypeople had already begun preparing it, it is an offense of confession.`
},

{
    id: 'Pc.30', title: 'Pācittiya 30', audio: '5Pc-30.mp3',
    text: `Yo pana bhikkhu bhikkhuniyā saddhiṃ eko ekāya raho nisajjaṃ kappeyya, pācittiyaṃ. [5.0]
Whatever monk should sit in private, alone with a nun, it is an offense of confession.
Bhikkhunovādavaggo tatiyo [2.5]
The third chapter, on teaching.`
},

{
    id: 'Pc.31', title: 'Pācittiya 31', audio: '5Pc-31.mp3',
    text: `Agilānena bhikkhunā eko āvasathapiṇḍo bhuñjitabbo. Tato ce uttariṃ bhuñjeyya, pācittiyaṃ. [6.0]
A monk who is not ill may eat one meal at a public rest-house. If he should eat more than that, it is an offense of confession.`
},

{
    id: 'Pc.32', title: 'Pācittiya 32', audio: '5Pc-32.mp3',
    text: `Gaṇabhojane aññatra samayā pācittiyaṃ. Tatthāyaṃ samayo, gilānasamayo, cīvaradānasamayo, [5.1]
Eating in a group, except at the proper time, is an offense of confession. Here, the proper time is: when ill; when robes are being given;
cīvarakārasamayo, addhānagamanasamayo, nāvābhiruhanasamayo, mahāsamayo, samaṇabhattasamayo, ayaṃ tattha samayo. [6.6]
when robes are being made; when on a journey; when on a boat; at a great occasion; at a meal for ascetics. This is the proper time.`
},

{
    id: 'Pc.33', title: 'Pācittiya 33', audio: '5Pc-33.mp3',
    text: `Paramparabhojane aññatra samayā pācittiyaṃ. [3.0]
Eating a subsequent meal, except at the proper time, is an offense of confession.
Tatthāyaṃ samayo, gilānasamayo, cīvaradānasamayo, cīvarakārasamayo, ayaṃ tattha samayo. [5.2]
Here, the proper time is: when ill; when robes are being given; when robes are being made. This is the proper time.`
},

{
    id: 'Pc.34', title: 'Pācittiya 34', audio: '5Pc-34.mp3',
    text: `Bhikkhuṃ paneva kulaṃ upagataṃ pūvehi vā manthehi vā abhihaṭṭhuṃ pavāreyya, [4.8]
In case a monk, having gone to a family, is offered cakes or parched grain to take as much as he wants,
ākaṅkhamānena bhikkhunā dvattipattapūrā paṭiggahetabbā. Tato ce uttariṃ paṭiggaṇheyya, pācittiyaṃ. [5.8]
he may accept at most two or three bowlfuls if he so desires. If he should accept more than that, it is an offense of confession.
Dvattipattapūre paṭiggahetvā tato nīharitvā bhikkhūhi saddhiṃ saṃvibhajitabbaṃ, ayaṃ tattha sāmīci. [6.2]
Having accepted two or three bowlfuls, he should take them away and share them with the monks; this is the proper procedure.`
},

{
    id: 'Pc.35', title: 'Pācittiya 35', audio: '5Pc-35.mp3',
    text: `Yo pana bhikkhu bhuttāvī pavārito anatirittaṃ khādanīyaṃ vā bhojanīyaṃ vā khādeyya vā bhuñjeyya vā, pācittiyaṃ. [7.0]
Whatever monk, having finished his meal and having turned down further food, should eat or consume staple or non-staple food that is not "left over," it is an offense of confession.`
},

{
    id: 'Pc.36', title: 'Pācittiya 36', audio: '5Pc-36.mp3',
    text: `Yo pana bhikkhu bhikkhuṃ bhuttāviṃ pavāritaṃ anatirittena khādanīyena vā bhojanīyena vā abhihaṭṭhuṃ pavāreyya [6.1]
Whatever monk should knowingly present a monk who has finished his meal and turned down further food with staple or non-staple food that is not "left over,"
“handa bhikkhu khāda vā bhuñja vā”ti jānaṃ āsādanāpekkho, bhuttasmiṃ pācittiyaṃ. [5.2]
saying, "Here, monk, eat or consume this," with the intent of finding fault; if the other eats, it is an offense of confession.`
},

{
    id: 'Pc.37', title: 'Pācittiya 37', audio: '5Pc-37.mp3',
    text: `Yo pana bhikkhu vikāle khādanīyaṃ vā bhojanīyaṃ vā khādeyya vā bhuñjeyya vā, pācittiyaṃ. [5.7]
Whatever monk should eat or consume staple or non-staple food at the wrong time (after noon), it is an offense of confession.`
},

{
    id: 'Pc.38', title: 'Pācittiya 38', audio: '5Pc-38.mp3',
    text: `Yo pana bhikkhu sannidhikārakaṃ khādanīyaṃ vā bhojanīyaṃ vā khādeyya vā bhuñjeyya vā, pācittiyaṃ. [5.9]
Whatever monk should eat or consume staple or non-staple food that has been stored (overnight), it is an offense of confession.`
},

{
    id: 'Pc.39', title: 'Pācittiya 39', audio: '5Pc-39.mp3',
    text: `Yāni kho pana tāni paṇītabhojanāni, seyyathidaṃ – sappi, navanītaṃ, telaṃ, madhu, phāṇitaṃ, maccho, maṃsaṃ, khīraṃ, dadhi. [6.55]
These are superior foods, namely: ghee, butter, oil, honey, molasses, fish, meat, milk, and curd.
Yo pana bhikkhu evarūpāni paṇītabhojanāni agilāno attano atthāya viññāpetvā bhuñjeyya, pācittiyaṃ. [6.3]
Whatever monk who is not ill should ask for such superior foods for his own use and eat them, it is an offense of confession.`
},

{
    id: 'Pc.40', title: 'Pācittiya 40', audio: '5Pc-40.mp3',
    text: `Yo pana bhikkhu adinnaṃ mukhadvāraṃ āhāraṃ āhareyya aññatra udakadantaponā, pācittiyaṃ. Bhojanavaggo catuttho. [7.5]
Whatever monk should put food into his mouth that has not been given, except for water and tooth-sticks, it is an offense of confession. The fourth chapter, on Food.`
},

{
    id: 'Pc.41', title: 'Pācittiya 41', audio: '5Pc-41.mp3',
    text: `Yo pana bhikkhu acelakassa vā paribbājakassa vā paribbājikāya vā sahatthā khādanīyaṃ vā bhojanīyaṃ vā dadeyya, pācittiyaṃ. [7.6]
Whatever monk should give staple or non-staple food with his own hand to a naked ascetic or a wanderer (male or female), it is an offense of confession.`
},

{
    id: 'Pc.42', title: 'Pācittiya 42', audio: '5Pc-42.mp3',
    text: `Yo pana bhikkhu bhikkhuṃ “ehāvuso, gāmaṃ vā nigamaṃ vā piṇḍāya pavisissāmā”ti [4.7]
Whatever monk, having said to another monk, "Come, friend, let’s enter the village or town for alms,"
tassa dāpetvā vā adāpetvā vā uyyojeyya [3.0]
and having had food given to him or not, should dismiss him,
“gacchāvuso, na me tayā saddhiṃ kathā vā nisajjā vā phāsu hoti, [4.1]
saying, "Go, friend. Being with you, neither talking nor sitting is comfortable for me;
ekakassa me kathā vā nisajjā vā phāsu hotī”ti [3.5]
being alone, both talking and sitting are comfortable for me,"
etadeva paccayaṃ karitvā anaññaṃ, pācittiyaṃ. [3.6]
making this the only reason and no other, it is an offense of confession.`
},

{
    id: 'Pc.43', title: 'Pācittiya 43', audio: '5Pc-43.mp3',
    text: `Yo pana bhikkhu sabhojane kule anupakhajja nisajjaṃ kappeyya, pācittiyaṃ. [4.8]
Whatever monk should sit intruding on a family at their mealtime, it is an offense of confession.`
},

{
    id: 'Pc.44', title: 'Pācittiya 44', audio: '5Pc-44.mp3',
    text: `Yo pana bhikkhu mātugāmena saddhiṃ raho paṭicchanne āsane nisajjaṃ kappeyya, pācittiyaṃ. [5.5]
Whatever monk should sit in private with a woman on a secluded seat, it is an offense of confession.`
},

{
    id: 'Pc.45', title: 'Pācittiya 45', audio: '5Pc-45.mp3',
    text: `Yo pana bhikkhu mātugāmena saddhiṃ eko ekāya raho nisajjaṃ kappeyya, pācittiyaṃ. [5.3]
Whatever monk should sit in private, alone with a woman, it is an offense of confession.`
},

{
    id: 'Pc.46', title: 'Pācittiya 46', audio: '5Pc-46.mp3',
    text: `Yo pana bhikkhu nimantito sabhatto samāno santaṃ bhikkhuṃ anāpucchā purebhattaṃ vā pacchābhattaṃ vā [5.9]
Whatever monk, being invited to a meal, should go on a tour of families before or after the meal without asking permission of a monk who is present,
kulesu cārittaṃ āpajjeyya aññatra samayā, pācittiyaṃ. [3.4]
except at the proper time, it is an offense of confession.
Tatthāyaṃ samayo, cīvaradānasamayo, cīvarakārasamayo, ayaṃ tattha samayo. [4.8]
Here, the proper time is: the robe-giving season; the robe-making time. This is the proper time.`
},

{
    id: 'Pc.47', title: 'Pācittiya 47', audio: '5Pc-47.mp3',
    text: `Agilānena bhikkhunā catumāsappaccayapavāraṇā sāditabbā [3.8]
A monk who is not ill may accept a four-month invitation to ask for requisites,
aññatra punapavāraṇāya, aññatra niccapavāraṇāya. Tato ce uttariṃ sādiyeyya, pācittiyaṃ. [5.5]
unless the invitation is renewed or is permanent. If he should accept for longer than that, it is an offense of confession.`
},

{
    id: 'Pc.48', title: 'Pācittiya 48', audio: '5Pc-48.mp3',
    text: `Yo pana bhikkhu uyyuttaṃ senaṃ dassanāya gaccheyya aññatra tathārūpappaccayā, pācittiyaṃ. [5.5]
Whatever monk should go to see an army drawn up for battle, except for an appropriate reason, it is an offense of confession.`
},

{
    id: 'Pc.49', title: 'Pācittiya 49', audio: '5Pc-49.mp3',
    text: `Siyā ca tassa bhikkhuno kocideva paccayo senaṃ gamanāya, dirattatirattaṃ tena bhikkhunā senāya vasitabbaṃ. [5.8]
If there is some reason for a monk to go to an army, he may stay with the army for at most two or three nights.
Tato ce uttariṃ vaseyya, pācittiyaṃ. [3.0]
If he should stay longer than that, it is an offense of confession.`
},

{
    id: 'Pc.50', title: 'Pācittiya 50', audio: '5Pc-50.mp3',
    text: `Dirattatirattaṃ ce bhikkhu senāya vasamāno uyyodhikaṃ vā balaggaṃ vā senābyūhaṃ vā anīkadassanaṃ vā gaccheyya, pācittiyaṃ. [7.3]
If, while staying with an army for two or three nights, a monk should go to a battlefield, a roll-call, a troop deployment, or to see a review of the forces, it is an offense of confession.
Acelakavaggo pañcamo. [2.5]
The fifth chapter, on Naked Ascetics.`
},

{
    id: 'Pc.51-54', title: 'Pācittiya 51-54', audio: '5Pc-51-54.mp3',
    text: `Surāmerayapāne pācittiyaṃ. Aṅgulipatodake pācittiyaṃ. Udake hasadhamme pācittiyaṃ. Anādariye pācittiyaṃ. [7.0]
For the drinking of alcohol or fermented liquor, there is an offense of confession. For poking with the fingers (tickling), there is an offense of confession. For playing in the water, there is an offense of confession. For disrespect, there is an offense of confession.`
},

{
    id: 'Pc.55-56', title: 'Pācittiya 55-56', audio: '5Pc-55-56.mp3',
    text: `Yo pana bhikkhu bhikkhuṃ bhiṃsāpeyya, pācittiyaṃ. Yo pana bhikkhu agilāno visibbanāpekkho jotiṃ samādaheyya vā [6.4]
Whatever monk should try to frighten another monk, it is an offense of confession. Whatever monk, not being ill, seeking warmth, should kindle a fire
samādahāpeyya vā aññatra tathārūpappaccayā, pācittiyaṃ. [4.1]
or have one kindled, except for an appropriate reason, it is an offense of confession.`
},

{
    id: 'Pc.57', title: 'Pācittiya 57', audio: '5Pc-57.mp3',
    text: `Yo pana bhikkhu orenaddhamāsaṃ nahāyeyya aññatra samayā, pācittiyaṃ. Tatthāyaṃ samayo [4.8]
Whatever monk should bathe at intervals of less than half a month, except at the proper time, it is an offense of confession. Here, the proper time is:
“diyaḍḍho māso seso gimhāna”nti “vassānassa paṭhamo māso” [3.7]
the last month and a half of the hot season; the first month of the rains;
iccete aḍḍhateyyamāsā uṇhasamayo, pariḷāhasamayo, gilānasamayo, kammasamayo, addhānagamanasamayo, [5.8]
these two and a half months are the "hot time"; also the "fever time"; the time of illness; the time of work; the time of travel;
vātavuṭṭhisamayo, ayaṃ tattha samayo. [3.0]
the time of wind and rain. This is the proper time.`
},

{
    id: 'Pc.58', title: 'Pācittiya 58', audio: '5Pc-58.mp3',
    text: `Navaṃ pana bhikkhunā cīvaralābhena tiṇṇaṃ dubbaṇṇakaraṇānaṃ aññataraṃ dubbaṇṇakaraṇaṃ ādātabbaṃ [5.6]
When a monk receives a new robe, he must apply one of three discoloring marks to mar its beauty:
nīlaṃ vā kaddamaṃ vā kāḷasāmaṃ vā. Anādā ce bhikkhu tiṇṇaṃ dubbaṇṇakaraṇānaṃ aññataraṃ dubbaṇṇakaraṇaṃ [6.1]
either blue-green, mud-color, or blackish-brown. If a monk, without applying one of the three discoloring marks,
navaṃ cīvaraṃ paribhuñjeyya, pācittiyaṃ. [3.0]
should use a new robe, it is an offense of confession.`
},

{
    id: 'Pc.59', title: 'Pācittiya 59', audio: '5Pc-59.mp3',
    text: `Yo pana bhikkhu bhikkhussa vā bhikkhuniyā vā sikkhamānāya vā sāmaṇerassa vā sāmaṇeriyā vā sāmaṃ cīvaraṃ vikappetvā [6.8]
Whatever monk, having personally assigned a robe to a monk, a nun, a female trainee, a male novice, or a female novice,
appaccuddhāraṇaṃ paribhuñjeyya, pācittiyaṃ. [3.0]
should use it without it having been rescinded, it is an offense of confession.`
},

{
    id: 'Pc.60', title: 'Pācittiya 60', audio: '5Pc-60.mp3',
    text: `Yo pana bhikkhu bhikkhussa pattaṃ vā cīvaraṃ vā nisīdanaṃ vā sūcigharaṃ vā kāyabandhanaṃ vā apanidheyya vā [5.6]
Whatever monk should hide, or have hidden, a monk’s bowl, robe, sitting-mat, needle-case, or belt,
apanidhāpeyya vā antamaso hasāpekkhopi, pācittiyaṃ. Surāpānavaggo chaṭṭho. [5.5]
even as a joke, it is an offense of confession. The sixth chapter, on Alcohol.`
},

{
    id: 'Pc.61-62', title: 'Pācittiya 61-62', audio: '5Pc-61-62.mp3',
    text: `Yo pana bhikkhu sañcicca pāṇaṃ jīvitā voropeyya, pācittiyaṃ. Yo pana bhikkhu jānaṃ sappāṇakaṃ udakaṃ paribhuñjeyya, pācittiyaṃ. [7.5]
Whatever monk should intentionally deprive a living being of life, it is an offense of confession. Whatever monk should knowingly use water containing living beings, it is an offense of confession.`
},

{
    id: 'Pc.63', title: 'Pācittiya 63', audio: '5Pc-63.mp3',
    text: `Yo pana bhikkhu jānaṃ yathādhammaṃ nihatādhikaraṇaṃ punakammāya ukkoṭeyya, pācittiyaṃ. [5.5]
Whatever monk should knowingly reopen for further action a legal issue that has been settled in accordance with the rule, it is an offense of confession.`
},

{
    id: 'Pc.64', title: 'Pācittiya 64', audio: '5Pc-64.mp3',
    text: `Yo pana bhikkhu bhikkhussa jānaṃ duṭṭhullaṃ āpattiṃ paṭicchādeyya, pācittiyaṃ. [5.0]
Whatever monk should knowingly conceal a monk’s serious offense, it is an offense of confession.`
},

{
    id: 'Pc.65', title: 'Pācittiya 65', audio: '5Pc-65.mp3',
    text: `Yo pana bhikkhu jānaṃ ūnavīsativassaṃ puggalaṃ upasampādeyya, [4.0]
Whatever monk should knowingly give the full ordination to a person less than twenty years of age,
so ca puggalo anupasampanno, te ca bhikkhū gārayhā, [3.2]
that person is not ordained, those monks are blameworthy;
idaṃ tasmiṃ pācittiyaṃ. [2.3]
this is an offense of confession for him.`
},

{
    id: 'Pc.66', title: 'Pācittiya 66', audio: '5Pc-66.mp3',
    text: `Yo pana bhikkhu jānaṃ theyyasatthena saddhiṃ saṃvidhāya ekaddhānamaggaṃ paṭipajjeyya [5.0]
Whatever monk should knowingly, by arrangement, travel along the same path with a caravan of thieves,
antamaso gāmantarampi, pācittiyaṃ. [3.0]
even as far as the next village, it is an offense of confession.`
},

{
    id: 'Pc.67', title: 'Pācittiya 67', audio: '5Pc-67.mp3',
    text: `Yo pana bhikkhu mātugāmena saddhiṃ saṃvidhāya ekaddhānamaggaṃ paṭipajjeyya [4.5]
Whatever monk should, by arrangement, travel along the same path with a woman,
antamaso gāmantarampi, pācittiyaṃ. [2.8]
even as far as the next village, it is an offense of confession.`
},

{
    id: 'Pc.68', title: 'Pācittiya 68', audio: '5Pc-68.mp3',
    text: `Yo pana bhikkhu evaṃ vadeyya “tathāhaṃ bhagavatā dhammaṃ desitaṃ ājānāmi, [4.7]
Whatever monk should say: "As I understand the Dhamma taught by the Blessed One,
yathā yeme antarāyikā dhammā vuttā bhagavatā, [3.3]
those things called obstacles by the Blessed One
te paṭisevato nālaṃ antarāyāyā”ti, [2.9]
are not actually obstacles for one who indulges in them,"
so bhikkhu bhikkhūhi evamassa vacanīyo [2.4]
that monk should be spoken to by the monks thus:
“mā āyasmā evaṃ avaca, mā bhagavantaṃ abbhācikkhi, [3.4]
"Venerable sir, do not say that. Do not misrepresent the Blessed One.
na hi sādhu bhagavato abbhakkhānaṃ, na hi bhagavā evaṃ vadeyya, [3.8]
Misrepresentation of the Blessed One is not good. The Blessed One would not say that.
anekapariyāyena āvuso antarāyikā dhammā antarāyikā vuttā bhagavatā, [4.7]
In many ways, friend, the Blessed One has described obstructive things as obstacles,
alañca pana te paṭisevato antarāyāyā”ti. [3.1]
and they certainly are obstacles for one who indulges in them."
Evañca so bhikkhu bhikkhūhi vuccamāno tatheva paggaṇheyya, [3.7]
If that monk, when spoken to by the monks, should still persist,
so bhikkhu bhikkhūhi yāvatatiyaṃ samanubhāsitabbo tassa paṭinissaggāya. [4.1]
he should be admonished by the monks up to three times to give up that view.
Yāvatatiyañce samanubhāsiyamāno taṃ paṭinissajjeyya, iccetaṃ kusalaṃ. [4.2]
If, being admonished up to three times, he gives it up, that is good.
No ce paṭinissajjeyya, pācittiyaṃ. [3.3]
If he does not give it up, it is an offense of confession.`
},

{
    id: 'Pc.69', title: 'Pācittiya 69', audio: '5Pc-69.mp3',
    text: `Yo pana bhikkhu jānaṃ tathāvādinā bhikkhunā akaṭānudhammena taṃ diṭṭhiṃ appaṭinissaṭṭhena saddhiṃ sambhuñjeyya vā, saṃvaseyya vā, saha vā seyyaṃ kappeyya, pācittiyaṃ. [10.0]
Whatever monk should knowingly eat with, live with, or lie down in the same place as a monk who speaks in such a way, who has not acted in accordance with the rule, and who has not given up that view, it is an offense of confession.`
},

{
    id: 'Pc.70', title: 'Pācittiya 70', audio: '5Pc-70.mp3',
    text: `Samaṇuddesopi ce evaṃ vadeyya “tathāhaṃ bhagavatā dhammaṃ desitaṃ ājānāmi, [5.2]
If a novice should also say: "As I understand the Dhamma taught by the Blessed One,
yathā yeme antarāyikā dhammā vuttā bhagavatā, [3.35]
those things called obstacles by the Blessed One
te paṭisevato nālaṃ antarāyāyā”ti, [3.1]
are not actually obstacles for one who indulges in them,"
so samaṇuddeso bhikkhūhi evamassa vacanīyo [2.9]
that novice should be spoken to by the monks thus:
“mā āvuso, samaṇuddesa evaṃ avaca, [2.8]
"Friend novice, do not say that.
mā bhagavantaṃ abbhācikkhi, [2.1]
Do not misrepresent the Blessed One... (as above)..."
na hi sādhu bhagavato abbhakkhānaṃ, na hi bhagavā evaṃ vadeyya, [4.2]
anekapariyāyena āvuso, samaṇuddesa antarāyikā dhammā antarāyikā vuttā bhagavatā, [5.2]
alañca pana te paṭisevato antarāyāyā”ti, [3.3]
evañca so samaṇuddeso bhikkhūhi vuccamāno tatheva paggaṇheyya, [4.2]
If that novice, when spoken to by the monks, should still persist,
so samaṇuddeso bhikkhūhi evamassa vacanīyo [2.8]
he should be spoken to by the monks thus:
“ajjatagge te, āvuso, samaṇuddesa na ceva so bhagavā satthā apadisitabbo, [4.5]
"From this day forth, friend novice, you are not to claim the Blessed One as your teacher,
yampi caññe samaṇuddesā labhanti bhikkhūhi saddhiṃ dirattatirattaṃ sahaseyyaṃ, [4.6]
nor do you have the right to lie down in the same place for two or three nights with monks as other novices do.
sāpi te natthi, cara pire, vinassā”ti. [2.4]
Go away! Be gone!"
Yo pana bhikkhu jānaṃ tathānāsitaṃ samaṇuddesaṃ upalāpeyya vā, upaṭṭhāpeyya vā, [4.9]
Whatever monk should knowingly support, attend to,
sambhuñjeyya vā, saha vā seyyaṃ kappeyya, pācittiyaṃ. [5.8]
eat with, or lie down in the same place as a novice who has been thus expelled, it is an offense of confession.
Sappāṇakavaggo sattamo. [5.8]
The seventh chapter, on Living Beings.`
},

{
    id: 'Pc.71', title: 'Pācittiya 71', audio: '5Pc-71.mp3',
    text: `Yo pana bhikkhu bhikkhūhi sahadhammikaṃ vuccamāno evaṃ vadeyya [4.3]
Whatever monk, when being spoken to by monks in accordance with the Dhamma, should say:
“na tāvāhaṃ, āvuso, etasmiṃ sikkhāpade sikkhissāmi, [3.7]
"Friends, I will not train in this training rule
yāva na aññaṃ bhikkhuṃ byattaṃ vinayadharaṃ paripucchāmī”ti, pācittiyaṃ. [4.3]
until I have consulted another monk who is experienced and learned in the Vinaya," it is an offense of confession.
Sikkhamānena, bhikkhave, bhikkhunā aññātabbaṃ paripucchitabbaṃ paripañhitabbaṃ, ayaṃ tattha sāmīci. [6.0]
Monks, a monk who is training should understand, should ask, and should investigate. This is the proper procedure.`
},

{
    id: 'Pc.72', title: 'Pācittiya 72', audio: '5Pc-72.mp3',
    text: `Yo pana bhikkhu pātimokkhe uddissamāne evaṃ vadeyya [3.1]
Whatever monk, while the Pātimokkha is being recited, should say:
“kiṃ panimehi khuddānukhuddakehi sikkhāpadehi uddiṭṭhehi, [3.5]
"What is the use of these minor and lesser training rules being recited?
yāvadeva kukkuccāya vihesāya vilekhāya saṃvattantī”ti, sikkhāpadavivaṇṇake pācittiyaṃ. [6.0]
They only lead to worry, frustration, and confusion," in disparagement of the training rules, it is an offense of confession.`
},

{
    id: 'Pc.73', title: 'Pācittiya 73', audio: '5Pc-73.mp3',
    text: `Yo pana bhikkhu anvaddhamāsaṃ pātimokkhe uddissamāne evaṃ vadeyya [4.0]
Whatever monk, while the Pātimokkha is being recited every half-month, should say:
“idāneva kho ahaṃ jānāmi, ayampi kira dhammo suttāgato suttapariyāpanno anvaddhamāsaṃ uddesaṃ āgacchatī”ti. [6.6]
"Only now do I realize that this rule is handed down in the Suttas, included in the Suttas, and comes into recitation every half-month."
Tañce bhikkhuṃ aññe bhikkhū jāneyyuṃ: “nisinnapubbaṃ iminā bhikkhunā [4.3]
If the other monks should know: "This monk has sat there before
dvattikkhattuṁ pātimokkhe uddissamāne, ko pana vādo bhiyyo”ti, [3.9]
two or three times while the Pātimokkha was being recited, let alone more,"
na ca tassa bhikkhuno aññāṇakena mutti atthi, yañca tattha āpattiṃ āpanno, [4.4]
there is no release for that monk on account of his ignorance. Whatever offense he has committed,
tañca yathādhammo kāretabbo, uttariṃ cassa moho āropetabbo [4.3]
he should be dealt with in accordance with the rule, and furthermore, a charge of delusion should be laid:
“tassa te, āvuso, alābhā, tassa te dulladdhaṃ, [3.1]
"It is no gain for you, friend, it is poorly attained by you,
yaṃ tvaṃ pātimokkhe uddissamāne na sādhukaṃ aṭṭhiṁ katvā manasi karosī”ti, [4.7]
that you do not pay proper attention and take it to heart when the Pātimokkha is being recited."
idaṃ tasmiṃ mohanake pācittiyaṃ. [2.7]
This is an offense of confession for deceptive behavior.`
},

{
    id: 'Pc.74', title: 'Pācittiya 74', audio: '5Pc-74.mp3',
    text: `Yo pana bhikkhu bhikkhussa kupito anattamano pahāraṃ dadeyya, pācittiyaṃ. [4.6]
Whatever monk, being angry and displeased, should give a blow to another monk, it is an offense of confession.`
},

{
    id: 'Pc.75', title: 'Pācittiya 75', audio: '5Pc-75.mp3',
    text: `Yo pana bhikkhu bhikkhussa kupito anattamano talasattikaṃ uggireyya, pācittiyaṃ. [4.8]
Whatever monk, being angry and displeased, should raise his hand in a threatening gesture against another monk, it is an offense of confession.`
},

{
    id: 'Pc.76', title: 'Pācittiya 76', audio: '5Pc-76.mp3',
    text: `Yo pana bhikkhu bhikkhuṃ amūlakena saṅghādisesena anuddhaṃseyya, pācittiyaṃ. [4.8]
Whatever monk should groundlessly charge a monk with a Saṅghādisesa offense, it is an offense of confession.`
},

{
    id: 'Pc.77', title: 'Pācittiya 77', audio: '5Pc-77.mp3',
    text: `Yo pana bhikkhu bhikkhussa sañcicca kukkuccaṃ upadaheyya “itissa muhuttampi aphāsu bhavissatī”ti [5.1]
Whatever monk should intentionally cause worry to another monk, thinking, "In this way he will be uncomfortable even for a moment,"
etadeva paccayaṃ karitvā anaññaṃ, pācittiyaṃ. [3.6]
making this the only reason and no other, it is an offense of confession.`
},

{
    id: 'Pc.78', title: 'Pācittiya 78', audio: '5Pc-78.mp3',
    text: `Yo pana bhikkhu bhikkhūnaṃ bhaṇḍanajātānaṃ kalahajātānaṃ vivādāpannānaṃ upassutiṃ tiṭṭheyya [6.3]
Whatever monk should stand eavesdropping on monks who are quarreling, brawling, or disputing,
“yaṃ ime bhaṇissanti, taṃ sossāmī”ti etadeva paccayaṃ karitvā anaññaṃ, pācittiyaṃ. [5.3]
thinking, "I will hear what they say," making this the only reason and no other, it is an offense of confession.`
},

{
    id: 'Pc.79', title: 'Pācittiya 79', audio: '5Pc-79.mp3',
    text: `Yo pana bhikkhu dhammikānaṃ kammānaṃ chandaṃ datvā pacchā khīyanadhammaṃ āpajjeyya, pācittiyaṃ. [6.3]
Whatever monk, having given his consent for formal acts that are in accordance with the Dhamma, should later complain (about them), it is an offense of confession.`
},

{
    id: 'Pc.80', title: 'Pācittiya 80', audio: '5Pc-80.mp3',
    text: `Yo pana bhikkhu saṅghe vinicchayakathāya vattamānāya chandaṃ adatvā uṭṭhāyāsanā pakkameyya, pācittiyaṃ. [6.5]
Whatever monk, while a discussion for a decision is going on in the Saṅgha, should leave his seat and go away without having given his consent, it is an offense of confession.`
},

{
    id: 'Pc.81', title: 'Pācittiya 81', audio: '5Pc-81.mp3',
    text: `Yo pana bhikkhu samaggena saṅghena cīvaraṃ datvā pacchā khīyanadhammaṃ āpajjeyya [5.0]
Whatever monk, after a robe has been given by a harmonious Saṅgha, should later complain:
“yathāsanthutaṃ bhikkhū saṅghikaṃ lābhaṃ pariṇāmentī”ti, pācittiyaṃ. [4.3]
"The monks divert the Saṅgha's property according to their favorites," it is an offense of confession.`
},

{
    id: 'Pc.82', title: 'Pācittiya 82', audio: '5Pc-82.mp3',
    text: `Yo pana bhikkhu jānaṃ saṅghikaṃ lābhaṃ pariṇataṃ puggalassa pariṇāmeyya, pācittiyaṃ. Sahadhammikavaggo aṭṭhamo. [6.6]
Whatever monk should knowingly divert to an individual gains intended for the community, it is an offense of confession. The eighth chapter, on In-accordance-with-the-Dhamma.`
},

{
    id: 'Pc.83', title: 'Pācittiya 83', audio: '5Pc-83.mp3',
    text: `Yo pana bhikkhu rañño khattiyassa muddhābhisittassa anikkhantarājake aniggataratanake [5.0]
Whatever monk should cross the threshold of an anointed Khattiya king from which the king has not departed and from which the treasures have not been removed,
pubbe appaṭisaṃvidito indakhīlaṃ atikkāmeyya, pācittiyaṃ. [4.5]
without being previously announced, it is an offense of confession.`
},

{
    id: 'Pc.84', title: 'Pācittiya 84', audio: '5Pc-84.mp3',
    text: `Yo pana bhikkhu ratanaṃ vā ratanasammataṃ vā aññatra ajjhārāmā vā ajjhāvasathā vā uggaṇheyya vā uggaṇhāpeyya vā, pācittiyaṃ. [7.8]
Whatever monk should pick up a jewel or what is considered a jewel, or have it picked up, except in a monastery or in a dwelling, it is an offense of confession.
Ratanaṃ vā pana bhikkhunā ratanasammataṃ vā ajjhārāme vā ajjhāvasathe vā uggahetvā vā uggahāpetvā vā nikkhipitabbaṃ [6.8]
But a jewel or what is considered a jewel that has been picked up by a monk (or caused to be picked up) in a monastery or a dwelling must be kept,
“yassa bhavissati, so harissatī”ti, ayaṃ tattha sāmīci. [3.7]
thinking, "Whoever it belongs to will come for it." This is the proper procedure.`
},

{
    id: 'Pc.85', title: 'Pācittiya 85', audio: '5Pc-85.mp3',
    text: `Yo pana bhikkhu santaṃ bhikkhuṃ anāpucchā vikāle gāmaṃ paviseyya [4.0]
Whatever monk should enter a village at the wrong time (after noon) without asking permission of a monk who is present,
aññatra tathārūpā accāyikā karaṇīyā, pācittiyaṃ. [4.0]
except in a case of urgency, it is an offense of confession.`
},

{
    id: 'Pc.86', title: 'Pācittiya 86', audio: '5Pc-86.mp3',
    text: `Yo pana bhikkhu aṭṭhimayaṃ vā dantamayaṃ vā visāṇamayaṃ vā sūcigharaṃ kārāpeyya, bhedanakaṃ pācittiyaṃ. [6.2]
Whatever monk should have a needle-case made of bone, ivory, or horn, it is an offense of confession and must be broken.`
},

{
    id: 'Pc.87', title: 'Pācittiya 87', audio: '5Pc-87.mp3',
    text: `Navaṃ pana bhikkhunā mañcaṃ vā pīṭhaṃ vā kārayamānena aṭṭhaṅgulapādakaṃ kāretabbaṃ [5.4]
When a monk is having a new bed or bench made, it should have legs at most eight finger-breadths long,
sugataṅgulena aññatra heṭṭhimāya aṭaniyā. Taṃ atikkāmayato chedanakaṃ pācittiyaṃ. [6.0]
according to the Sugata's finger-breadth, not counting the frame. For him who exceeds that, it is an offense of confession and must be cut down.`
},

{
    id: 'Pc.88', title: 'Pācittiya 88', audio: '5Pc-88.mp3',
    text: `Yo pana bhikkhu mañcaṃ vā pīṭhaṃ vā tūlonaddhaṃ kārāpeyya, uddālanakaṃ pācittiyaṃ. [6.0]
Whatever monk should have a bed or bench upholstered with cotton, it is an offense of confession and must be stripped.`
},

{
    id: 'Pc.89', title: 'Pācittiya 89', audio: '5Pc-89.mp3',
    text: `Nisīdanaṃ pana bhikkhunā kārayamānena pamāṇikaṃ kāretabbaṃ, [4.1]
When a sitting-mat is being made for a monk, it must be of the standard measurement.
tatridaṃ pamāṇaṃ, dīghaso dve vidatthiyo sugatavidatthiyā, tiriyaṃ diyaḍḍhaṃ, dasā vidatthi. [5.3]
Here, the measurement is: two spans long according to the Sugata's span, one and a half spans wide, and the border one span.
Taṃ atikkāmayato chedanakaṃ pācittiyaṃ. [3.3]
For him who exceeds that, it is an offense of confession and must be cut down.`
},

{
    id: 'Pc.90', title: 'Pācittiya 90', audio: '5Pc-90.mp3',
    text: `Kaṇḍuppaṭicchādiṃ pana bhikkhunā kārayamānena pamāṇikā kāretabbā, tatridaṃ pamāṇaṃ, [5.4]
When a skin-eruption cloth is being made for a monk, it must be of the standard measurement.
dīghaso catasso vidatthiyo sugatavidatthiyā, tiriyaṃ dve vidatthiyo. [3.8]
Here, the measurement is: four spans long according to the Sugata's span, and two spans wide.
Taṃ atikkāmayato chedanakaṃ pācittiyaṃ. [3.3]
For him who exceeds that, it is an offense of confession and must be cut down.`
},

{
    id: 'Pc.91', title: 'Pācittiya 91', audio: '5Pc-91.mp3',
    text: `Vassikasāṭikaṃ pana bhikkhunā kārayamānena pamāṇikā kāretabbā, [4.45]
When a rains-residence cloth is being made for a monk, it must be of the standard measurement.
tatridaṃ pamāṇaṃ, dīghaso cha vidatthiyo sugatavidatthiyā, tiriyaṃ aḍḍhateyyā. Taṃ atikkāmayato chedanakaṃ pācittiyaṃ. [7.0]
Here, the measurement is: six spans long according to the Sugata's span, and two and a half spans wide. For him who exceeds that, it is an offense of confession and must be cut down.`
},

{
    id: 'Pc.92', title: 'Pācittiya 92', audio: '5Pc-92.mp3',
    text: `Yo pana bhikkhu sugatacīvarappamāṇaṃ cīvaraṃ kārāpeyya, atirekaṃ vā, chedanakaṃ pācittiyaṃ. [5.4]
Whatever monk should have a robe made the size of the Sugata's robe, or larger, it is an offense of confession and must be cut down.
Tatridaṃ sugatassa sugatacīvarappamāṇaṃ, [2.65]
Here, the measurement of the Sugata's Sugata-robe is:
dīghaso nava vidatthiyo sugatavidatthiyā, tiriyaṃ cha vidatthiyo, idaṃ sugatassa sugatacīvarappamāṇaṃ. [5.4]
nine spans long and six spans wide. This is the measurement of the Sugata's Sugata-robe.
Ratanavaggo navamo. [2.5]
The ninth chapter, on Jewels.`
},

{
    id: 'Pc.U', title: 'Pācittiya Uddiṭṭhā', audio: '5Pc-U.mp3',
    text: `Uddiṭṭhā kho āyasmanto dvenavuti pācittiyā dhammā. Tatthāyasmante pucchāmi, kaccittha parisuddhā, [5.5]
Venerable sirs, the ninety-two rules for confession have been recited. In this regard, I ask the venerable sirs: Are you pure in this?
dutiyampi pucchāmi, kaccittha parisuddhā, tatiyampi pucchāmi, kaccittha parisuddhā, [4.0]
A second time I ask: Are you pure? A third time I ask: Are you pure?
parisuddhetthāyasmanto, tasmā tuṇhī, evametaṃ dhārayāmīti. [4.2]
You are pure in this, therefore you are silent. Thus do I understand it.
Pācittiyā dhammā niṭṭhitā. [3.0]
The section on rules for confession is finished.`
},

 


{
    id: 'Pd.1', title: 'Pāṭidesanīya 1', audio: '6Pd-01.mp3',
    text: `Ime kho panāyasmanto cattāro pāṭidesanīyā Dhammā uddesaṃ āgacchanti. [5.4]
Venerable sirs, these four rules for acknowledgement come into recitation.
Yo pana bhikkhu aññātikāya bhikkhuniyā antaragharaṃ paviṭṭhāya hatthato khādanīyaṃ vā bhojanīyaṃ vā [5.6]
Whatever monk, from the hand of a nun who is not a relative and who has entered a house,
sahatthā paṭiggahetvā khādeyya vā bhuñjeyya vā, paṭidesetabbaṃ [4.0]
should personally receive staple or non-staple food and eat or consume it, it must be acknowledged
tena bhikkhunā “gārayhaṃ, āvuso, dhammaṃ āpajjiṃ asappāyaṃ [3.9]
by that monk: "I have committed a blameworthy and unsuitable act,
pāṭidesanīyaṃ, taṃ paṭidesemī”ti. [3.0]
a matter for acknowledgement; I acknowledge it."`
},

{
    id: 'Pd.2', title: 'Pāṭidesanīya 2', audio: '6Pd-02.mp3',
    text: `Bhikkhū paneva kulesu nimantitā bhuñjanti, tatra ce sā bhikkhunī vosāsamānarūpā [5.1]
In case monks are eating, having been invited to a house, and a nun is there giving orders,
ṭhitā hoti “idha sūpaṃ detha, idha odanaṃ dethā”ti. [3.5]
standing and saying, "Give curry here, give rice here."
Tehi bhikkhūhi sā bhikkhunī apasādetabbā “apasakka tāva bhagini, [4.0]
Those monks should dismiss that nun: "Go away for a moment, sister,
yāva bhikkhū bhuñjantī”ti. Ekassapi ce bhikkhuno nappaṭibhāseyya taṃ bhikkhuniṃ apasādetuṃ [6.1]
while the monks are eating." If even one monk does not speak up to dismiss that nun,
“apasakka tāva bhagini, yāva bhikkhū bhuñjantī”ti, paṭidesetabbaṃ [3.9]
saying, "Go away for a moment, sister, while the monks are eating," it must be acknowledged
tehi bhikkhūhi “gārayhaṃ, āvuso, dhammaṃ āpajjimhā asappāyaṃ pāṭidesanīyaṃ, [5.0]
by those monks: "We have committed a blameworthy and unsuitable act, a matter for acknowledgement;
taṃ paṭidesemā”ti. [2.1]
we acknowledge it."`
},

{
    id: 'Pd.3', title: 'Pāṭidesanīya 3', audio: '6Pd-03.mp3',
    text: `Yāni kho pana tāni sekkhasammatāni kulāni, yo pana bhikkhu tathārūpesu sekkhasammatesu kulesu pubbe animantito [6.85]
Regarding those families designated as "trainees," whatever monk, in such families, without being previously invited
agilāno khādanīyaṃ vā, bhojanīyaṃ vā sahatthā paṭiggahetvā [3.9]
and not being ill, should personally receive staple or non-staple food
khādeyya vā, bhuñjeyya vā, paṭidesetabbaṃ [2.85]
and eat or consume it, it must be acknowledged
tena bhikkhunā “gārayhaṃ, āvuso, dhammaṃ āpajjiṃ asappāyaṃ pāṭidesanīyaṃ, taṃ paṭidesemī”ti. [6.4]
by that monk: "I have committed a blameworthy and unsuitable act, a matter for acknowledgement; I acknowledge it."`
},

{
    id: 'Pd.4', title: 'Pāṭidesanīya 4', audio: '6Pd-04.mp3',
    text: `Yāni kho pana tāni āraññakāni senāsanāni sāsaṅkasammatāni sappaṭibhayāni, [5.1]
Regarding those forest lodgings that are considered dangerous and frightening,
yo pana bhikkhu tathārūpesu senāsanesu viharanto [3.3]
whatever monk living in such lodgings,
pubbe appaṭisaṃviditaṃ khādanīyaṃ vā, bhojanīyaṃ vā ajjhārāme sahatthā paṭiggahetvā [5.45]
having personally received staple or non-staple food in the monastery precinct without having been previously notified,
agilāno khādeyya vā, bhuñjeyya vā, paṭidesetabbaṃ [3.45]
and not being ill, should eat or consume it, it must be acknowledged
tena bhikkhunā “gārayhaṃ, āvuso, dhammaṃ āpajjiṃ asappāyaṃ pāṭidesanīyaṃ, taṃ paṭidesemī”ti. [6.5]
by that monk: "I have committed a blameworthy and unsuitable act, a matter for acknowledgement; I acknowledge it."`
},

{
    id: 'Pd.U', title: 'Pāṭidesanīya Uddiṭṭhā', audio: '6Pd-U.mp3',
    text: `Uddiṭṭhā kho āyasmanto cattāro pāṭidesanīyā dhammā. [3.7]
Venerable sirs, the four rules for acknowledgement have been recited.
Tatthāyasmante pucchāmi, kaccittha parisuddhā, dutiyampi pucchāmi, kaccittha parisuddhā, [4.4]
In this regard, I ask the venerable sirs: Are you pure? A second time I ask: Are you pure?
tatiyampi pucchāmi, kaccittha parisuddhā, [2.3]
A third time I ask: Are you pure?
parisuddhetthāyasmanto, tasmā tuṇhī, evametaṃ dhārayāmīti. [4.2]
You are pure in this, therefore you are silent. Thus do I understand it.
Pāṭidesanīyā Niṭṭhitā. [2.6]
The section on rules for acknowledgement is finished.`
},

{
    id: 'Sk.1-2', title: 'Sekhiya 1-2', audio: '7Sk-01-02.mp3',
    text: `Ime kho panāyasmanto sekhiyā dhammā uddesaṃ āgacchanti. [4.1]
Venerable sirs, these rules for training come into recitation.
Parimaṇḍalaṃ nivāsessāmīti sikkhā karaṇīyā. Parimaṇḍalaṃ pārupissāmīti sikkhā karaṇīyā. [5.3]
"I will wear the lower robe wrapped evenly all around," is a training to be observed. "I will wear the upper robe wrapped evenly all around," is a training to be observed.`
},

{
    id: 'Sk.3-4', title: 'Sekhiya 3-4', audio: '7Sk-03-04.mp3',
    text: `Suppaṭicchanno antaraghare gamissāmīti sikkhā karaṇīyā. Suppaṭicchanno antaraghare nisīdissāmīti sikkhā karaṇīyā. [6.0]
"I will go well-covered in inhabited areas," is a training to be observed. "I will sit well-covered in inhabited areas," is a training to be observed.`
},

{
    id: 'Sk.5-6', title: 'Sekhiya 5-6', audio: '7Sk-05-06.mp3',
    text: `Susaṃvuto antaraghare gamissāmīti sikkhā karaṇīyā. Susaṃvuto antaraghare nisīdissāmīti sikkhā karaṇīyā. [5.8]
"I will go well-restrained in inhabited areas," is a training to be observed. "I will sit well-restrained in inhabited areas," is a training to be observed.`
},

{
    id: 'Sk.7-8', title: 'Sekhiya 7-8', audio: '7Sk-07-08.mp3',
    text: `Okkhittacakkhu antaraghare gamissāmīti sikkhā karaṇīyā. Okkhittacakkhu antaraghare nisīdissāmīti sikkhā karaṇīyā. [6.0]
"I will go with eyes lowered in inhabited areas," is a training to be observed. "I will sit with eyes lowered in inhabited areas," is a training to be observed.`
},

{
    id: 'Sk.9-10', title: 'Sekhiya 9-10', audio: '7Sk-09-10.mp3',
    text: `Na ukkhittakāya antaraghare gamissāmīti sikkhā karaṇīyā. Na ukkhittakāya antaraghare nisīdissāmīti sikkhā karaṇīyā. [5.6]
"I will not go with robes hitched up in inhabited areas," is a training to be observed. "I will not sit with robes hitched up in inhabited areas," is a training to be observed.
Parimaṇḍalavaggo paṭhamo. [3.0]
The first chapter, on Wrapping Around.`
},

{
    id: 'Sk.11-12', title: 'Sekhiya 11-12', audio: '7Sk-11-12.mp3',
    text: `Na ujjagghikāya antaraghare gamissāmīti sikkhā karaṇīyā. Na ujjagghikāya antaraghare nisīdissāmīti sikkhā karaṇīyā. [6.3]
"I will not go laughing loudly in inhabited areas," is a training to be observed. "I will not sit laughing loudly in inhabited areas," is a training to be observed.`
},

{
    id: 'Sk.13-14', title: 'Sekhiya 13-14', audio: '7Sk-13-14.mp3',
    text: `Appasaddo antaraghare gamissāmīti sikkhā karaṇīyā. Appasaddo antaraghare nisīdissāmīti sikkhā karaṇīyā. [5.5]
"I will go with little sound in inhabited areas," is a training to be observed. "I will sit with little sound in inhabited areas," is a training to be observed.`
},

{
    id: 'Sk.15-16', title: 'Sekhiya 15-16', audio: '7Sk-15-16.mp3',
    text: `Na kāyappacālakaṃ antaraghare gamissāmīti sikkhā karaṇīyā. Na kāyappacālakaṃ antaraghare nisīdissāmīti sikkhā karaṇīyā. [6.0]
"I will not go swaying the body in inhabited areas," is a training to be observed. "I will not sit swaying the body in inhabited areas," is a training to be observed.`
},

{
    id: 'Sk.17-18', title: 'Sekhiya 17-18', audio: '7Sk-17-18.mp3',
    text: `Na bāhuppacālakaṃ antaraghare gamissāmīti sikkhā karaṇīyā. Na bāhuppacālakaṃ antaraghare nisīdissāmīti sikkhā karaṇīyā. [5.8]
"I will not go swaying the arms in inhabited areas," is a training to be observed. "I will not sit swaying the arms in inhabited areas," is a training to be observed.`
},

{
    id: 'Sk.19-20', title: 'Sekhiya 19-20', audio: '7Sk-19-20.mp3',
    text: `Na sīsappacālakaṃ antaraghare gamissāmīti sikkhā karaṇīyā. Na sīsappacālakaṃ antaraghare nisīdissāmīti sikkhā karaṇīyā. [5.5]
"I will not go swaying the head in inhabited areas," is a training to be observed. "I will not sit swaying the head in inhabited areas," is a training to be observed.
Ujjagghikavaggo dutiyo. [2.4]
The second chapter, on Loud Laughter.`
},

{
    id: 'Sk.21-22', title: 'Sekhiya 21-22', audio: '7Sk-21-22.mp3',
    text: `Na khambhakato antaraghare gamissāmīti sikkhā karaṇīyā. [2.95]
"I will not go with arms akimbo (hands on hips) in inhabited areas," is a training to be observed.
Na khambhakato antaraghare nisīdissāmīti sikkhā karaṇīyā. [3.4]
"I will not sit with arms akimbo in inhabited areas," is a training to be observed.`
},

{
    id: 'Sk.23-24', title: 'Sekhiya 23-24', audio: '7Sk-23-24.mp3',
    text: `Na oguṇṭhito antaraghare gamissāmīti sikkhā karaṇīyā. Na oguṇṭhito antaraghare nisīdissāmīti sikkhā karaṇīyā. [6.2]
"I will not go with my head covered in inhabited areas," is a training to be observed. "I will not sit with my head covered in inhabited areas," is a training to be observed.`
},

{
    id: 'Sk.25-26', title: 'Sekhiya 25-26', audio: '7Sk-25-26.mp3',
    text: `Na ukkuṭikāya antaraghare gamissāmīti sikkhā karaṇīyā. Na pallatthikāya antaraghare nisīdissāmīti sikkhā karaṇīyā. [6.0]
"I will not go tiptoeing/squatting in inhabited areas," is a training to be observed. "I will not sit lolling (with knees up and arms/cloth around them) in inhabited areas," is a training to be observed.`
},

{
    id: 'Sk.27-28', title: 'Sekhiya 27-28', audio: '7Sk-27-28.mp3',
    text: `Sakkaccaṃ piṇḍapātaṃ paṭiggahessāmīti sikkhā karaṇīyā. [2.9]
"I will receive alms-food appreciatively," is a training to be observed.
Pattasaññī piṇḍapātaṃ paṭiggahessāmīti sikkhā karaṇīyā. [3.5]
"I will receive alms-food with eyes on the bowl," is a training to be observed.`
},

{
    id: 'Sk.29-30', title: 'Sekhiya 29-30', audio: '7Sk-29-30.mp3',
    text: `Samasūpakaṃ piṇḍapātaṃ paṭiggahessāmīti sikkhā karaṇīyā. Samatittikaṃ piṇḍapātaṃ paṭiggahessāmīti sikkhā karaṇīyā. [5.9]
"I will receive alms-food with a proportional amount of curry," is a training to be observed. "I will receive alms-food level with the rim," is a training to be observed.
Khambhakatavaggo tatiyo. [2.5]
The third chapter, on Arms Akimbo.`
},

{
    id: 'Sk.31-32', title: 'Sekhiya 31-32', audio: '7Sk-31-32.mp3',
    text: `Sakkaccaṃ piṇḍapātaṃ bhuñjissāmīti sikkhā karaṇīyā. Pattasaññī piṇḍapātaṃ bhuñjissāmīti sikkhā karaṇīyā. [5.8]
"I will eat alms-food appreciatively," is a training to be observed. "I will eat alms-food with eyes on the bowl," is a training to be observed.`
},

{
    id: 'Sk.33-34', title: 'Sekhiya 33-34', audio: '7Sk-33-34.mp3',
    text: `Sapadānaṃ piṇḍapātaṃ bhuñjissāmīti sikkhā karaṇīyā. Samasūpakaṃ piṇḍapātaṃ bhuñjissāmīti sikkhā karaṇīyā. [5.8]
"I will eat alms-food systematically (from one side)," is a training to be observed. "I will eat alms-food with a proportional amount of curry," is a training to be observed.`
},

{
    id: 'Sk.35-36', title: 'Sekhiya 35-36', audio: '7Sk-35-36.mp3',
    text: `Na thūpakato omadditvā piṇḍapātaṃ bhuñjissāmīti sikkhā karaṇīyā. Na sūpaṃ vā byañjanaṃ vā [5.0]
"I will not eat alms-food pressing down from the top," is a training to be observed. "I will not cover up curry or bean-sauce
odanena paṭicchādessāmi bhiyyokamyataṃ upādāyāti sikkhā karaṇīyā. [4.3]
with rice out of a desire for more," is a training to be observed.`
},

{
    id: 'Sk.37', title: 'Sekhiya 37', audio: '7Sk-37.mp3',
    text: `Na sūpaṃ vā odanaṃ vā agilāno attano atthāya viññāpetvā bhuñjissāmīti sikkhā karaṇīyā. [5.5]
"I will not eat curry or rice that I have asked for myself, unless I am ill," is a training to be observed.`
},

{
    id: 'Sk.38', title: 'Sekhiya 38', audio: '7Sk-38.mp3',
    text: `Na ujjhānasaññī paresaṃ pattaṃ olokessāmīti sikkhā karaṇīyā. [4.3]
"I will not look at another's bowl with critical intent," is a training to be observed.`
},

{
    id: 'Sk.39-40', title: 'Sekhiya 39-40', audio: '7Sk-39-40.mp3',
    text: `Nātimahantaṃ kabaḷaṃ karissāmīti sikkhā karaṇīyā. Parimaṇḍalaṃ ālopaṃ karissāmīti sikkhā karaṇīyā. Sakkaccavaggo catuttho. [7.5]
"I will not make an extra-large mouthful," is a training to be observed. "I will make a round mouthful," is a training to be observed. The fourth chapter, on Appreciatively.`
},

{
    id: 'Sk.41-42', title: 'Sekhiya 41-42', audio: '7Sk-41-42.mp3',
    text: `Na anāhaṭe kabaḷe mukhadvāraṃ vivarissāmīti sikkhā karaṇīyā. Na bhuñjamāno sabbaṃ hatthaṃ mukhe pakkhipissāmīti sikkhā karaṇīyā. [7.5]
"I will not open the mouth until the mouthful has been brought to it," is a training to be observed. "I will not put the whole hand into the mouth while eating," is a training to be observed.`
},

{
    id: 'Sk.43-44', title: 'Sekhiya 43-44', audio: '7Sk-43-44.mp3',
    text: `Na sakabaḷena mukhena byāharissāmīti sikkhā karaṇīyā. [3.2]
"I will not speak with the mouth full," is a training to be observed.
Na piṇḍukkhepakaṃ bhuñjissāmīti sikkhā karaṇīyā. [3.3]
"I will not eat tossing food into the mouth," is a training to be observed.`
},

{
    id: 'Sk.45-46', title: 'Sekhiya 45-46', audio: '7Sk-45-46.mp3',
    text: `Na kabaḷāvacchedakaṃ bhuñjissāmīti sikkhā karaṇīyā. [3.05]
"I will not eat biting off mouthfuls," is a training to be observed.
Na avagaṇḍakārakaṃ bhuñjissāmīti sikkhā karaṇīyā. [3.3]
"I will not eat stuffing the cheeks," is a training to be observed.`
},

{
    id: 'Sk.47-48', title: 'Sekhiya 47-48', audio: '7Sk-47-48.mp3',
    text: `Na hatthaniddhunakaṃ bhuñjissāmīti sikkhā karaṇīyā. [2.85]
"I will not eat shaking the hand (to remove food)," is a training to be observed.
Na sitthāvakārakaṃ bhuñjissāmīti sikkhā karaṇīyā. [3.7]
"I will not eat scattering grains of rice," is a training to be observed.`
},

{
    id: 'Sk.49-50', title: 'Sekhiya 49-50', audio: '7Sk-49-50.mp3',
    text: `Na jivhānicchārakaṃ bhuñjissāmīti sikkhā karaṇīyā. [3.36]
"I will not eat sticking out the tongue," is a training to be observed.
Na capucapukārakaṃ bhuñjissāmīti sikkhā karaṇīyā. Kabaḷavaggo pañcamo. [4.8]
"I will not eat making a smacking sound," is a training to be observed. The fifth chapter, on Mouthfuls.`
},

{
    id: 'Sk.51-52', title: 'Sekhiya 51-52', audio: '7Sk-51-52.mp3',
    text: `Na surusurukārakaṃ bhuñjissāmīti sikkhā karaṇīyā. [3.1]
"I will not eat making a slurping sound," is a training to be observed.
Na hatthanillehakaṃ bhuñjissāmīti sikkhā karaṇīyā. [3.5]
"I will not eat licking the hands," is a training to be observed.`
},

{
    id: 'Sk.53-54', title: 'Sekhiya 53-54', audio: '7Sk-53-54.mp3',
    text: `Na pattanillehakaṃ bhuñjissāmīti sikkhā karaṇīyā. [3.05]
"I will not eat licking the bowl," is a training to be observed.
Na oṭṭhanillehakaṃ bhuñjissāmīti sikkhā karaṇīyā. [3.6]
"I will not eat licking the lips," is a training to be observed.`
},

{
    id: 'Sk.55', title: 'Sekhiya 55', audio: '7Sk-55.mp3',
    text: `Na sāmisena hatthena pānīyathālakaṃ paṭiggahessāmīti sikkhā karaṇīyā. [4.7]
"I will not accept a water vessel with a hand soiled by food," is a training to be observed.`
},

{
    id: 'Sk.56', title: 'Sekhiya 56', audio: '7Sk-56.mp3',
    text: `Na sasitthakaṃ pattadhovanaṃ antaraghare chaḍḍessāmīti sikkhā karaṇīyā. [4.5]
"I will not discard bowl-washing water containing grains of rice in inhabited areas," is a training to be observed.`
},

{
    id: 'Sk.57', title: 'Sekhiya 57', audio: '7Sk-57.mp3',
    text: `Na chattapāṇissa agilānassa dhammaṃ desessāmīti sikkhā karaṇīyā. [4.1]
"I will not teach the Dhamma to someone who is not ill and who is carrying a sunshade," is a training to be observed.`
},

{
    id: 'Sk.58', title: 'Sekhiya 58', audio: '7Sk-58.mp3',
    text: `Na daṇḍapāṇissa agilānassa dhammaṃ desessāmīti sikkhā karaṇīyā. [4.1]
"I will not teach the Dhamma to someone who is not ill and who is carrying a staff," is a training to be observed.`
},

{
    id: 'Sk.59', title: 'Sekhiya 59', audio: '7Sk-59.mp3',
    text: `Na satthapāṇissa agilānassa dhammaṃ desessāmīti sikkhā karaṇīyā. [4.1]
"I will not teach the Dhamma to someone who is not ill and who is carrying a knife," is a training to be observed.`
},

{
    id: 'Sk.60', title: 'Sekhiya 60', audio: '7Sk-60.mp3',
    text: `Na āvudhapāṇissa agilānassa dhammaṃ desessāmīti sikkhā karaṇīyā. Surusuruvaggo chaṭṭho. [6.6]
"I will not teach the Dhamma to someone who is not ill and who is carrying a weapon," is a training to be observed. The sixth chapter, on Slurping.`
},

{
    id: 'Sk.61', title: 'Sekhiya 61', audio: '7Sk-61.mp3',
    text: `Na pādukāruḷhassa agilānassa dhammaṃ desessāmīti sikkhā karaṇīyā. [4.8]
"I will not teach the Dhamma to someone who is not ill and is wearing wooden sandals," is a training to be observed.`
},

{
    id: 'Sk.62', title: 'Sekhiya 62', audio: '7Sk-62.mp3',
    text: `Na upāhanāruḷhassa agilānassa dhammaṃ desessāmīti sikkhā karaṇīyā. [4.2]
"I will not teach the Dhamma to someone who is not ill and is wearing shoes (footwear)," is a training to be observed.`
},

{
    id: 'Sk.63', title: 'Sekhiya 63', audio: '7Sk-63.mp3',
    text: `Na yānagatassa agilānassa dhammaṃ desessāmīti sikkhā karaṇīyā. [4.2]
"I will not teach the Dhamma to someone who is not ill and is in a vehicle," is a training to be observed.`
},

{
    id: 'Sk.64', title: 'Sekhiya 64', audio: '7Sk-64.mp3',
    text: `Na sayanagatassa agilānassa dhammaṃ desessāmīti sikkhā karaṇīyā. [4.1]
"I will not teach the Dhamma to someone who is not ill and is lying on a bed (or couch)," is a training to be observed.`
},

{
    id: 'Sk.65', title: 'Sekhiya 65', audio: '7Sk-65.mp3',
    text: `Na pallatthikāya nisinnassa agilānassa dhammaṃ desessāmīti sikkhā karaṇīyā. [4.7]
"I will not teach the Dhamma to someone who is not ill and is sitting lolling (clasping the knees)," is a training to be observed.`
},

{
    id: 'Sk.66', title: 'Sekhiya 66', audio: '7Sk-66.mp3',
    text: `Na veṭhitasīsassa agilānassa dhammaṃ desessāmīti sikkhā karaṇīyā. [4.5]
"I will not teach the Dhamma to someone who is not ill and is wearing a turban (head-wrap)," is a training to be observed.`
},

{
    id: 'Sk.67', title: 'Sekhiya 67', audio: '7Sk-67.mp3',
    text: `Na oguṇṭhitasīsassa agilānassa dhammaṃ desessāmīti sikkhā karaṇīyā. [4.5]
"I will not teach the Dhamma to someone who is not ill and whose head is covered (with a robe or cloth)," is a training to be observed.`
},

{
    id: 'Sk.68', title: 'Sekhiya 68', audio: '7Sk-68.mp3',
    text: `Na chamāyaṃ nisīditvā āsane nisinnassa agilānassa [3.1]
"I will not teach the Dhamma while sitting on the ground to someone who is not ill and is sitting on a seat,
dhammaṃ desessāmīti sikkhā karaṇīyā. [3.0]
is a training to be observed."`
},

{
    id: 'Sk.69', title: 'Sekhiya 69', audio: '7Sk-69.mp3',
    text: `Na nīce āsane nisīditvā ucce āsane nisinnassa agilānassa dhammaṃ desessāmīti sikkhā karaṇīyā. [6.1]
"I will not teach the Dhamma while sitting on a low seat to someone who is not ill and is sitting on a high seat," is a training to be observed.`
},

{
    id: 'Sk.70', title: 'Sekhiya 70', audio: '7Sk-70.mp3',
    text: `Na ṭhito nisinnassa agilānassa dhammaṃ desessāmīti sikkhā karaṇīyā. [4.5]
"I will not teach the Dhamma while standing to someone who is not ill and is sitting down," is a training to be observed.`
},

{
    id: 'Sk.71', title: 'Sekhiya 71', audio: '7Sk-71.mp3',
    text: `Na pacchato gacchanto purato gacchantassa agilānassa dhammaṃ desessāmīti sikkhā karaṇīyā. [5.3]
"I will not teach the Dhamma while walking behind to someone who is not ill and is walking in front," is a training to be observed.`
},

{
    id: 'Sk.72', title: 'Sekhiya 72', audio: '7Sk-72.mp3',
    text: `Na uppathena gacchanto pathena gacchantassa agilānassa dhammaṃ desessāmīti sikkhā karaṇīyā. [5.3]
"I will not teach the Dhamma while walking beside the path to someone who is not ill and is walking on the path," is a training to be observed.`
},

{
    id: 'Sk.73', title: 'Sekhiya 73', audio: '7Sk-73.mp3',
    text: `Na ṭhito agilāno uccāraṃ vā passāvaṃ vā karissāmīti sikkhā karaṇīyā. [5.1]
"I will not ease myself (defecate or urinate) while standing, if not ill," is a training to be observed.`
},

{
    id: 'Sk.74', title: 'Sekhiya 74', audio: '7Sk-74.mp3',
    text: `Na harite agilāno uccāraṃ vā passāvaṃ vā kheḷaṃ vā karissāmīti sikkhā karaṇīyā. [5.5]
"I will not ease myself or spit on green plants, if not ill," is a training to be observed.`
},

{
    id: 'Sk.75', title: 'Sekhiya 75', audio: '7Sk-75.mp3',
    text: `Na udake agilāno uccāraṃ vā passāvaṃ vā kheḷaṃ vā karissāmīti sikkhā karaṇīyā. [4.9]
"I will not ease myself or spit in water, if not ill," is a training to be observed.
Pādukavaggo sattamo. [2.8]
The seventh chapter, on Sandals.`
},

{
    id: 'Sk.U', title: 'Sekhiya Uddiṭṭhā', audio: '7Sk-U.mp3',
    text: `Uddiṭṭhā kho āyasmanto sekhiyā dhammā. Tatthāyasmante pucchāmi, kaccittha parisuddhā, [5.3]
Venerable sirs, the rules for training have been recited. In this regard, I ask the venerable sirs: Are you pure in this?
dutiyampi pucchāmi, kaccittha parisuddhā, tatiyampi pucchāmi, kaccittha parisuddhā, [3.85]
A second time I ask: Are you pure? A third time I ask: Are you pure?
parisuddhetthāyasmanto, tasmā tuṇhī, evametaṃ dhārayāmīti. Sekhiyā Niṭṭhitā. [6.1]
You are pure in this, therefore you are silent. Thus do I understand it. The training rules are finished.`
},

{
    id: 'As', title: 'Adhikaraṇa-samatha', audio: '8As.mp3',
    text: `Ime kho panāyasmanto satta adhikaraṇasamathā Dhammā uddesaṃ āgacchanti. [5.0]
Venerable sirs, these seven rules for the settling of disputes come into recitation.
Uppannuppannānaṃ adhikaraṇānaṃ samathāya vūpasamāya: Sammukhāvinayo dātabbo, Sativinayo dātabbo, [5.9]
For the settling and quieting of disputes as they arise: (1) Removal in the presence, (2) Removal through mindfulness,
Amūḷhavinayo dātabbo, Paṭiññāya kāretabbaṃ, Yebhuyyasikā, Tassapāpiyasikā, Tiṇavatthārako’ti. [6.9]
(3) Removal for one who is past insanity, (4) Acting in accordance with what is admitted, (5) Decision by a majority, (6) Acting in accordance with the further misconduct (of the accused), (7) Covering over as if with grass.`
},

{
    id: 'As.U', title: 'Adhikaraṇa-samatha Uddiṭṭhā', audio: '8As-U.mp3',
    text: `Uddiṭṭhā kho āyasmanto satta adhikaraṇasamathā dhammā. Tatthāyasmante, pucchāmi kaccittha parisuddhā, [5.6]
Venerable sirs, the seven rules for the settling of disputes have been recited. In this regard, I ask: Are you pure?
dutiyampi pucchāmi, kaccittha parisuddhā, tatiyampi pucchāmi, kaccittha parisuddhā, [3.95]
A second time I ask: Are you pure? A third time I ask: Are you pure?
parisuddhetthāyasmanto, tasmā tuṇhī, evametaṃ dhārayāmīti. [4.5]
You are pure in this, therefore you are silent. Thus do I understand it.
Adhikaraṇasamathā Niṭṭhitā. [2.6]
The settling of disputes is finished.`
},

{
    id: 'Niṭṭhita', title: 'Niṭṭhita', audio: '9-Nitthita.mp3',
    text: `Uddiṭṭhaṃ kho āyasmanto nidānaṃ, Uddiṭṭhā cattāro pārājikā dhammā, Uddiṭṭhā terasa saṅghādisesā dhammā, Uddiṭṭhā dve aniyatā dhammā, [8.8]
Venerable sirs, the introduction has been recited, the four rules involving defeat have been recited, the thirteen rules involving a formal meeting of the community have been recited, the two indefinite rules have been recited,
Uddiṭṭhā tiṃsa nissaggiyā pācittiyā dhammā, Uddiṭṭhā dvenavuti pācittiyā dhammā, [5.1]
the thirty rules involving confession with forfeiture have been recited, the ninety-two rules involving confession have been recited,
Uddiṭṭhā cattāro pāṭidesanīyā dhammā, Uddiṭṭhā sekhiyā dhammā, [4.3]
the four rules for acknowledgement have been recited, the training rules have been recited,
Uddiṭṭhā satta adhikaraṇasamathā dhammā, [2.6]
the seven rules for the settling of disputes have been recited.
ettakaṃ tassa bhagavato suttāgataṃ suttapariyāpannaṃ anvaddhamāsaṃ uddesaṃ āgacchati, [5.3]
So much of the Blessed One's word, handed down in the Suttas, included in the Suttas, comes into recitation every half-month.
tattha sabbeheva samaggehi sammodamānehi avivadamānehi sikkhitabbanti. [4.9]
Therein, all should train in harmony, in mutual appreciation, without disputing.
Bhikkhu Pātimokkhaṃ Niṭṭhitaṃ. [3.6]
The Bhikkhu's Pātimokkha is finished.`
}
		
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
    const validIndices = allWords.map((w, i) => cleanPaliWord(w) ? i : -1).filter(i => i !== -1);
    
    // 2. Determine number of blanks
    let countToHide = Math.ceil(validIndices.length * hideRatio);
    if (countToHide < 1) countToHide = 1;
    if (countToHide > validIndices.length) countToHide = validIndices.length;

    // 3. Randomly select indices to hide
    const shuffledIndices = validIndices.sort(() => 0.5 - Math.random());
    const hiddenIndices = shuffledIndices.slice(0, countToHide).sort((a, b) => a - b);
    
    // 4. Get Correct Words (CLEANED)
    const correctHiddenWords = hiddenIndices.map(i => cleanPaliWord(allWords[i]));
    
    // 5. Generate Distractors (CLEANED)
    // We need: (Total hidden * 3) - Correct Words = Total Distractors needed
    const totalOptionsNeeded = hiddenIndices.length * 3;
    const distractorCount = totalOptionsNeeded - correctHiddenWords.length;
    
    const distractors = getDistractors(lineIdx, distractorCount);
    
    // 6. Create Word Bank (All Cleaned)
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
		
audioPlayer.addEventListener('volumechange', () => {
    // Save the current volume (0.0 to 1.0) to localStorage
    localStorage.setItem('savedAudioVolume', audioPlayer.volume);
});

        // Sự kiện khi audio chạy hết bài: Reset về 0:00 và thoát chế độ Recitation
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

    // --- LOGIC GIAO DIỆN & PERSISTENCE ---
    /* --- UPDATED NAVIGATION LOGIC --- */

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
    audioPlayer.src = 'audio/' + sections[index].audio; // Ensure path is correct ('audio/' or './audio/')
    
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
    
    // 2. Add to Daily XP Log (Existing logic)
    const today = new Date().toISOString().split('T')[0];
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
    const today = new Date().toISOString().split('T')[0];
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
            bannerTitle.innerHTML = '<i class="fas fa-wreath-laurel"></i> Vinayavidū <i class="fas fa-wreath-laurel"></i>';
            bannerSubtitle.innerHTML = 'Certification of Achievement: Full&nbsp;Memorization&nbsp;of&nbsp;the&nbsp;Pātimokkha';
             showGrandAchievement();
        } else {
            bannerTitle.innerHTML = '<i class="fas fa-wreath-laurel"></i> Sikkhāpadavidū <i class="fas fa-wreath-laurel"></i>';
            bannerSubtitle.innerHTML = 'Certification of Achievement in&nbsp;Memorizing&nbsp;this&nbsp;Sikkhāpada';
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
                ticks: { color: '#9ca3af', font: { size: 11 } }
            }
        },
        plugins: {
            legend: { labels: { color: '#9ca3af', font: { size: 11 } } },
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
                legend: { labels: { color: '#9ca3af' }, position: 'bottom' },
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
    alert("Sādhu! You have successfully completed this sikkhāpada.");
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
    // --- NEW: GENERATE DASHBOARD ---
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
            }, 1000); 
        } else {
            setTimeout(finishQuizSuccess, 1000);
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

