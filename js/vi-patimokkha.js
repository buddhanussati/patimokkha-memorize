
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

    // Get text
    var rawText = $(this).text();
    var word = rawText.toLowerCase().trim();

    // --- CRITICAL FIX: Remove punctuation from edges ---
    // The original script split text by punctuation. Since your HTML 
    // includes punctuation in the span (e.g., "dhammo,"), we must strip it here.
    word = word.replace(/^[“‘"(\[]+|[”’"),.\]?!:;]+$/g, '');

    // Standard replacements from original script
    word = word.replace(/­/g, ''); // optional hyphen
    // Fix specific Pali spelling variations handled in original script
    word = word.replace(/ṁg/g, 'ṅg')
               .replace(/ṁk/g, 'ṅk')
               .replace(/ṁ/g, 'ṁ'); // (Original had this, keeping for safety)

    // Perform Lookup
    var meaning = lookupWord(word, rawText); // Pass rawText for display title
    
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
Đảnh Lễ Đức Thế Tôn, Bậc A-La-Hán, Chánh Đẳng Giác.
Namo tassa Bhagavato Arahato Sammāsambuddhassa. [5.042]
Đảnh Lễ Đức Thế Tôn, Bậc A-La-Hán, Chánh Đẳng Giác.
Namo tassa Bhagavato Arahato Sammāsambuddhassa. [6.308]
Đảnh Lễ Đức Thế Tôn, Bậc A-La-Hán, Chánh Đẳng Giác.
Suṇātu me (bhante/āvuso) saṅgho. Ajjuposatho pannaraso, yadi saṅghassa pattakallaṃ, saṅgho uposathaṃ kareyya, pātimokkhaṃ uddiseyya. [12.409]
Bạch chư Đại đức Tăng, xin Tăng hãy nghe tôi. Hôm nay ngày mười lăm là ngày Uposatha. Nếu là thời điểm thích hợp cho hội chúng, hội chúng nên làm lễ Uposatha, nên đọc tụng giới bổn Pātimokkha.
Kiṃ saṅghassa pubbakiccaṃ? Pārisuddhiṃ āyasmanto ārocetha, [5.733]
Phận sự trước tiên của hội chúng là gì? Các đại đức hãy tuyên bố sự trong sạch
pātimokkhaṃ uddisissāmi, [2.542]
rồi tôi sẽ đọc tụng giới bổn Pātimokkha.
taṃ sabbeva santā sādhukaṃ suṇoma manasi karoma. [4.134]
Tất cả chúng ta ở đây hãy cùng nghe cho thật kỹ, hãy khéo tác ý.
Yassa siyā āpatti, so āvikareyya, asantiyā āpattiyā tuṇhī bhavitabbaṃ, [6.082]
Ai có phạm lỗi thì hãy phát lộ; nếu không có lỗi thì nên im lặng.
tuṇhībhāvena kho panāyasmante “parisuddhā”ti vedissāmi. [5.325]
Do sự im lặng, tôi sẽ biết các đại đức đã được trong sạch.
Yathā kho pana paccekapuṭṭhassa veyyākaraṇaṃ hoti, evamevaṃ evarūpāya parisāya yāvatatiyaṃ anusāvitaṃ hoti. [9.090]
Cũng như việc trả lời khi được hỏi riêng biệt, trong hội chúng như thế này, việc thông báo sẽ được lập lại cho đến lần thứ ba.
Yo pana bhikkhu yāvatatiyaṃ anusāviyamāne saramāno santiṃ āpattiṃ nāvikareyya, [6.201]
Tỳ-khưu nào khi được thông báo đến lần thứ ba mà nhớ mình có lỗi nhưng không phát lộ,
sampajānamusāvādassa hoti. [2.711]
người đó phạm lỗi cố ý nói dối.
Sampajānamusāvādo kho panāyasmanto antarāyiko dhammo vutto bhagavatā, [5.763]
Này các đại đức, Đức Thế Tôn đã dạy rằng cố ý nói dối là pháp chướng ngại.
tasmā saramānena bhikkhunā āpannena visuddhāpekkhena santī āpatti āvikātabbā, āvikatā hissa phāsu hoti. [8.857]
Vì thế, vị Tỳ-khưu có phạm lỗi, nếu muốn được trong sạch, khi nhớ ra hãy phát lộ lỗi ấy; vì khi đã phát lộ, vị ấy sẽ được an lạc.
Uddiṭṭhaṃ kho āyasmanto nidānaṃ. Tatthāyasmante pucchāmi, kaccittha parisuddhā, [5.832]
Này các đại đức, phần Duyên Khởi đã được tụng xong. Trong phần này tôi xin hỏi các đại đức: Các đại đức có trong sạch không?
dutiyampi pucchāmi, kaccittha parisuddhā, tatiyampi pucchāmi, kaccittha parisuddhā, [5.092]
Tôi xin hỏi lần thứ nhì: Các đại đức có trong sạch không? Tôi xin hỏi lần thứ ba: Các đại đức có trong sạch không?
parisuddhetthāyasmanto, tasmā tuṇhī, evametaṃ dhārayāmīti. Nidānuddeso paṭhamo [8.3]
Các đại đức trong sạch, do đó mới im lặng. Tôi xin ghi nhận sự việc như vậy. Phần Duyên Khởi là chương thứ nhất.`
},

{
    id: 'Pr.1', title: 'Pārājika 1', audio: '1Pr-01.mp3',
    text: `Tatrime cattāro pārājikā dhammā uddesaṃ āgacchanti. [5.0]
Dưới đây là bốn pháp Bất Cộng Trụ (Pārājika) được tụng đọc đến.
Yo pana bhikkhu bhikkhūnaṃ sikkhāsājīvasamāpanno sikkhaṃ appaccakkhāya dubbalyaṃ anāvikatvā methunaṃ dhammaṃ paṭiseveyya, [8.56]
Tỳ-khưu nào đã thọ trì sự học tập và đời sống của Tỳ-khưu, khi chưa lìa bỏ sự học tập và chưa tuyên bố sự yếu đuối trong việc thực hành, rồi hành dâm,
antamaso tiracchānagatāyapi, pārājiko hoti asaṃvāso. [5.5]
cho đến đối với loài thú, thì bị tội Bất Cộng Trụ (Pārājika), không còn được cộng trú với Tăng chúng.`
},

{
    id: 'Pr.2', title: 'Pārājika 2', audio: '1Pr-02.mp3',
    text: `Yo pana bhikkhu gāmā vā araññā vā adinnaṃ theyyasaṅkhātaṃ ādiyeyya, [5.2]
Tỳ-khưu nào từ làng mạc hay rừng núi, lấy vật không được cho với ý định trộm cắp,
yathārūpe adinnādāne rājāno coraṃ gahetvā haneyyuṃ vā bandheyyuṃ vā pabbājeyyuṃ vā [8.0]
với hành vi lấy của không cho như thế, nếu vua chúa bắt được kẻ trộm có thể giết, hoặc xiềng xích, hoặc đuổi đi
corosi bālosi mūḷhosi thenosīti, [3.6]
và phán rằng: "Ngươi là kẻ trộm, ngươi là kẻ ngu, ngươi là kẻ mê muội, ngươi là kẻ gian";
tathārūpaṃ bhikkhu adinnaṃ ādiyamāno ayampi pārājiko hoti asaṃvāso. [5.6]
vị Tỳ-khưu lấy của không cho với tính chất tương tự như vậy, vị ấy cũng bị tội Bất Cộng Trụ, không còn được cộng trú.`
},

{
    id: 'Pr.3', title: 'Pārājika 3', audio: '1Pr-03.mp3',
    text: `Yo pana bhikkhu sañcicca manussaviggahaṃ jīvitā voropeyya, satthahārakaṃ vāssa pariyeseyya, [6.2]
Tỳ-khưu nào cố ý đoạn trừ mạng sống của con người, hoặc đi tìm kiếm khí giới giết người cho họ,
maraṇavaṇṇaṃ vā saṃvaṇṇeyya, maraṇāya vā samādapeyya [3.85]
hoặc khen ngợi sự chết, hoặc khuyên bảo đi đến sự chết rằng:
"ambho purisa kiṃ tuyhiminā pāpakena dujjīvitena, mataṃ te jīvitā seyyo"ti, [5.5]
"Này bạn, cái đời sống ác hại khổ sở này có ích gì cho bạn đâu, thà bạn chết đi còn hơn là sống";
iti cittamano cittasaṅkappo anekapariyāyena maraṇavaṇṇaṃ vā saṃvaṇṇeyya, maraṇāya vā samādapeyya, [6.7]
với ý định như vậy, với mục đích như vậy, bằng nhiều phương cách khác nhau, khen ngợi sự chết hay khuyên bảo đi đến sự chết,
ayampi pārājiko hoti asaṃvāso. [3.5]
vị ấy cũng bị tội Bất Cộng Trụ, không còn được cộng trú.`
},

{
    id: 'Pr.4', title: 'Pārājika 4', audio: '1Pr-04.mp3',
    text: `Yo pana bhikkhu anabhijānaṃ uttarimanussadhammaṃ attupanāyikaṃ alamariyañāṇadassanaṃ samudācareyya [6.85]
Tỳ-khưu nào không có tu chứng thật sự mà tự khoe mình có pháp thượng nhân, có tri kiến của bậc thánh,
“iti jānāmi, iti passāmī”ti, tato aparena samayena samanuggāhīyamāno vā [5.35]
nói rằng: "Tôi biết như vầy, tôi thấy như vầy"; rồi vào dịp khác, khi bị thẩm vấn hay
asamanuggāhīyamāno vā āpanno visuddhāpekkho evaṃ vadeyya [4.65]
không bị thẩm vấn, vì muốn được trong sạch nên nói rằng:
“ajānamevaṃ āvuso avacaṃ jānāmi, apassaṃ passāmi, tucchaṃ musā vilapi”nti, [5.1]
"Này hiền giả, tôi không biết mà nói là biết, không thấy mà nói là thấy, tôi đã nói dối, nói suông";
aññatra adhimānā, ayampi pārājiko hoti asaṃvāso. [5.0]
ngoại trừ trường hợp tự tin thái quá, vị ấy cũng bị tội Bất Cộng Trụ, không còn được cộng trú.`
},

{
    id: 'Pr.U', title: 'Pārājika Uddiṭṭhā', audio: '1Pr-U.mp3',
    text: `Uddiṭṭhā kho āyasmanto cattāro pārājikā dhammā. [3.91]
Này các đại đức, bốn pháp Bất Cộng Trụ đã được tụng xong.
Yesaṃ bhikkhu aññataraṃ vā aññataraṃ vā āpajjitvā na labhati bhikkhūhi saddhiṃ saṃvāsaṃ [5.9]
Vị Tỳ-khưu nào phạm vào bất cứ điều nào trong các điều ấy thì không còn được cộng trú với các Tỳ-khưu khác.
yathā pure, tathā pacchā, pārājiko hoti asaṃvāso. [4.2]
Trước như thế nào, sau cũng như thế ấy, bị tội Bất Cộng Trụ, không còn được cộng trú.
Tatthāyasmante pucchāmi, kaccittha parisuddhā, dutiyampi pucchāmi, kaccittha parisuddhā, [5.1]
Trong phần này tôi xin hỏi các đại đức: Các đại đức có trong sạch không? Tôi xin hỏi lần thứ nhì: Các đại đức có trong sạch không?
tatiyampi pucchāmi, kaccittha parisuddhā, parisuddhetthāyasmanto, tasmā tuṇhī, [5.2]
Tôi xin hỏi lần thứ ba: Các đại đức có trong sạch không? Các đại đức trong sạch, do đó mới im lặng.
evametaṃ dhārayāmīti. Pārājikuddeso dutiyo [5.5]
Tôi xin ghi nhận sự việc như vậy. Chương Bất Cộng Trụ là chương thứ hai.`
},

 
 
{
    id: 'Sg.1', title: 'Saṅghādisesa 1', audio: '2Sg-01.mp3',
    text: `Ime kho panāyasmanto terasa saṅghādisesā Dhammā uddesaṃ āgacchanti. [5.6]
Này các đại đức, đây là mười ba pháp Tăng Tàn (Saṅghādisesa) được tụng đọc đến.
Sañcetanikā sukkavissaṭṭhi aññatra supinantā saṅghādiseso. [5.0]
Cố ý làm xuất tinh, ngoại trừ khi đang chiêm bao, thì phạm tội Tăng Tàn.`
},

{
    id: 'Sg.2', title: 'Saṅghādisesa 2', audio: '2Sg-02.mp3',
    text: `Yo pana bhikkhu otiṇṇo vipariṇatena cittena mātugāmena saddhiṃ kāyasaṃsaggaṃ samāpajjeyya [6.3]
Tỳ-khưu nào bị tình dục chi phối, với tâm biến đổi, có sự tiếp xúc thân thể với nữ nhân,
hatthaggāhaṃ vā veṇiggāhaṃ vā aññatarassa vā aññatarassa vā aṅgassa parāmasanaṃ, saṅghādiseso. [8.0]
như nắm tay, hay nắm tóc, hoặc chạm vào bất cứ phần thân thể nào khác, thì phạm tội Tăng Tàn.`
},

{
    id: 'Sg.3', title: 'Saṅghādisesa 3', audio: '2Sg-03.mp3',
    text: `Yo pana bhikkhu otiṇṇo vipariṇatena cittena mātugāmaṃ duṭṭhullāhi vācāhi obhāseyya [6.2]
Tỳ-khưu nào bị tình dục chi phối, với tâm biến đổi, dùng những lời thô tục tán tỉnh nữ nhân,
yathā taṃ yuvā yuvatiṃ methunupasaṃhitāhi, saṅghādiseso. [4.8]
như lời của thanh niên đối với thiếu nữ liên quan đến việc hành dâm, thì phạm tội Tăng Tàn.`
},

{
    id: 'Sg.4', title: 'Saṅghādisesa 4', audio: '2Sg-04.mp3',
    text: `Yo pana bhikkhu otiṇṇo vipariṇatena cittena mātugāmassa santike attakāmapāricariyāya vaṇṇaṃ bhāseyya [6.7]
Tỳ-khưu nào bị tình dục chi phối, với tâm biến đổi, ở trước mặt nữ nhân tự ca ngợi việc phục vụ tình dục cho mình rằng:
“etadaggaṃ bhagini pāricariyānaṃ yā mādisaṃ sīlavantaṃ kalyāṇadhammaṃ brahmacāriṃ [5.6]
"Này cô, đây là sự phục vụ tối thượng, khi phục vụ một người có giới hạnh, có thiện pháp, sống phạm hạnh như tôi
etena dhammena paricareyyā”ti methunupasaṃhitena, saṅghādiseso. [5.2]
bằng cách này (hành dâm)", thì phạm tội Tăng Tàn.`
},

{
    id: 'Sg.5', title: 'Saṅghādisesa 5', audio: '2Sg-05.mp3',
    text: `Yo pana bhikkhu sañcarittaṃ samāpajjeyya itthiyā vā purisamatiṃ purisassa vā itthimatiṃ, [5.9]
Tỳ-khưu nào làm việc môi giới, đem ý định của người đàn bà đến cho người đàn ông, hoặc của người đàn ông đến cho người đàn bà,
jāyattane vā jārattane vā, antamaso taṅkhaṇikāyapi, saṅghādiseso. [6.0]
để làm vợ làm chồng, hay để làm nhân tình, cho đến chỉ là một cuộc gặp gỡ nhất thời, thì phạm tội Tăng Tàn.`
},

{
    id: 'Sg.6', title: 'Saṅghādisesa 6', audio: '2Sg-06.mp3',
    text: `Saññācikāya pana bhikkhunā kuṭiṃ kārayamānena assāmikaṃ attuddesaṃ pamāṇikā kāretabbā. [6.9]
Tỳ-khưu nào tự mình đi xin vật liệu để xây cất một ngôi thất không có thí chủ, với mục đích cho riêng mình, thì ngôi thất ấy phải được xây đúng kích thước.
Tatridaṃ pamāṇaṃ: dīghaso dvādasa vidatthiyo sugatavidatthiyā tiriyaṃ sattantarā, [5.2]
Kích thước ấy là: chiều dài mười hai gang tay của đức Phật, chiều rộng bên trong là bảy gang tay.
bhikkhū abhinetabbā vatthudesanāya. [2.9]
Các vị Tỳ-khưu phải được mời đến để chỉ định địa điểm.
Tehi bhikkhūhi vatthuṃ desetabbaṃ anārambhaṃ saparikkamanaṃ. Sārambhe ce bhikkhu vatthusmiṃ aparikkamane [6.9]
Các vị Tỳ-khưu ấy phải chỉ định địa điểm không có hại cho chúng sinh và có khoảng trống xung quanh. Nếu Tỳ-khưu xây thất tại địa điểm có hại cho chúng sinh, không có khoảng trống xung quanh,
saññācikāya kuṭiṃ kāreyya [2.2]
tự mình đi xin vật liệu để xây thất,
bhikkhū vā anabhineyya vatthudesanāya pamāṇaṃ vā atikkāmeyya saṅghādiseso. [6.2]
hoặc không mời các vị Tỳ-khưu đến chỉ định địa điểm, hay xây quá kích thước, thì phạm tội Tăng Tàn.`
},

{
    id: 'Sg.7', title: 'Saṅghādisesa 7', audio: '2Sg-07.mp3',
    text: `Mahallakaṃ pana bhikkhunā vihāraṃ kārayamānena sassāmikaṃ attuddesaṃ, bhikkhū abhinetabbā vatthudesanāya. [7.7]
Tỳ-khưu nào xây cất một ngôi tinh xá lớn có thí chủ, với mục đích cho riêng mình, thì các vị Tỳ-khưu phải được mời đến để chỉ định địa điểm.
Tehi bhikkhūhi vatthuṃ desetabbaṃ anārambhaṃ saparikkamanaṃ. Sārambhe ce bhikkhu vatthusmiṃ aparikkamane [6.6]
Các vị Tỳ-khưu ấy phải chỉ định địa điểm không có hại cho chúng sinh và có khoảng trống xung quanh. Nếu Tỳ-khưu xây tinh xá lớn tại địa điểm có hại cho chúng sinh, không có khoảng trống xung quanh,
mahallakaṃ vihāraṃ kāreyya, bhikkhū vā anabhineyya vatthudesanāya, saṅghādiseso. [5.6]
xây ngôi tinh xá lớn, hoặc không mời các vị Tỳ-khưu đến chỉ định địa điểm, thì phạm tội Tăng Tàn.`
},

{
    id: 'Sg.8', title: 'Saṅghādisesa 8', audio: '2Sg-08.mp3',
    text: `Yo pana bhikkhu bhikkhuṃ duṭṭho doso appatīto amūlakena pārājikena dhammena anuddhaṃseyya [6.3]
	Vị tỳ khưu nào xấu xa, sân hận, bất bình vị tỳ khưu (khác) rồi bôi nhọ về tội pārājika không có căn cứ (nghĩ rằng):
“appeva nāma naṃ imamhā brahmacariyā cāveyyan”ti, tato aparena samayena samanuggāhīyamāno vā [6.3]
‘Chắc là ta có thể loại vị ấy ra khỏi Phạm hạnh này.’ Sau đó vào lúc khác, trong khi bị chất vấn
asamanuggāhīyamāno vā amūlakañceva taṃ adhikaraṇaṃ hoti, [4.3]
hay trong khi không bị chất vấn, nếu vụ việc đó đúng là không có căn cứ, 
bhikkhu ca dosaṃ patiṭṭhāti, saṅghādiseso. [4.4]
và vị tỳ-khưu thừa nhận mình đã hành động vì lòng sân hận; vị ấy phạm tội Tăng Tàn`
},

{
    id: 'Sg.9', title: 'Saṅghādisesa 9', audio: '2Sg-09.mp3',
    text: `Yo pana bhikkhu bhikkhuṃ duṭṭho doso appatīto aññabhāgiyassa adhikaraṇassa kiñcidesaṃ lesamattaṃ upādāya [7.05]
	Vị tỳ-khưu nào vì tâm sân hận, nóng nảy, không hài lòng, lấy một tình tiết nhỏ nhặt chẳng liên quan gì từ một vụ việc khác, 
pārājikena dhammena anuddhaṃseyya [2.6]
rồi cáo buộc (vị tỳ-khưu khác) bằng một tội Pārājika:
“appeva nāma naṃ imamhā brahmacariyā cāveyyan”ti, tato aparena samayena [4.9]
‘Chắc là ta có thể loại vị ấy ra khỏi Phạm hạnh này.’ Sau đó vào lúc khác,
samanuggāhīyamāno vā asamanuggāhīyamāno vā [3.5]
trong khi bị chất vấn hay trong khi không bị chất vấn
aññabhāgiyañceva taṃ adhikaraṇaṃ hoti [2.9]
nếu vụ việc đó đúng là thuộc về một vấn đề khác, 
koci deso lesamatto upādinno, bhikkhu ca dosaṃ patiṭṭhāti, saṅghādiseso. [5.8]
chi tiết đưa ra chỉ là mượn cớ nhỏ nhặt, và vị tỳ-khưu thừa nhận mình đã hành động vì lòng sân hận, thì phạm tội Tăng Tàn.`
},

{
    id: 'Sg.10', title: 'Saṅghādisesa 10', audio: '2Sg-10.mp3',
    text: `Yo pana bhikkhu samaggassa saṅghassa bhedāya parakkameyya, [3.85]
Tỳ khưu nào ra sức chia rẽ Tăng chúng đang hòa hợp.
bhedanasaṃvattanikaṃ vā adhikaraṇaṃ samādāya paggayha tiṭṭheyya, [4.4]
Hoặc chấp trì, cố thủ vấn đề dẫn đến sự chia rẽ.
so bhikkhu bhikkhūhi evamassa vacanīyo [2.6]
Tỳ khưu ấy cần được các Tỳ khưu khuyên bảo như vầy:
“mā āyasmā samaggassa saṅghassa bhedāya parakkami, [3.4]
"Xin đại đức chớ nên ra sức chia rẽ Tăng chúng đang hòa hợp.
bhedanasaṃvattanikaṃ vā adhikaraṇaṃ samādāya paggayha aṭṭhāsi, [4.4]
Hoặc chớ nên chấp trì, cố thủ vấn đề dẫn đến sự chia rẽ.
sametāyasmā saṅghena, samaggo hi saṅgho [3.4]
Đại đức hãy hòa hợp với Tăng chúng, vì Tăng chúng hòa hợp,
sammodamāno avivadamāno ekuddeso phāsu viharatī”ti, [4.2]
hoan hỷ, không tranh cãi, cùng chung một giới bổn, sẽ sống an lạc".
evañca so bhikkhu bhikkhūhi vuccamāno tatheva paggaṇheyya, [3.9]
Dầu được các Tỳ khưu khuyên bảo như vậy, nhưng Tỳ khưu ấy vẫn cố thủ như thế,
so bhikkhu bhikkhūhi yāvatatiyaṃ samanubhāsitabbo tassa paṭinissaggāya, [4.5]
thì Tỳ khưu ấy cần được các Tỳ khưu can gián cho đến lần thứ ba để từ bỏ việc ấy.
yāvatatiyañce samanubhāsiyamāno taṃ paṭinissajjeyya, iccetaṃ kusalaṃ, [4.45]
Nếu đang được can gián cho đến lần thứ ba mà từ bỏ được, thời như vậy là tốt đẹp.
no ce paṭinissajjeyya, saṅghādiseso. [3.8]
Nếu không từ bỏ, thì phạm tội Tăng Tàn.`
},

{
    id: 'Sg.11', title: 'Saṅghādisesa 11', audio: '2Sg-11.mp3',
    text: `Tasseva kho pana bhikkhussa bhikkhū honti anuvattakā vaggavādakā eko vā dve vā tayo vā, te evaṃ vadeyyuṃ: [7.1]
Nếu tỳ khưu ấy có các tỳ khưu đồng lõa, phe đảng, một, hai, hoặc ba vị, và họ nói như vầy:
“mā āyasmanto etaṃ bhikkhuṃ kiñci avacuttha, [3.42]
"Xin các đại đức chớ nên nói điều chi đến tỳ khưu ấy,
dhammavādī ceso bhikkhu, vinayavādī ceso bhikkhu, amhākañceso bhikkhu [5.2]
bởi tỳ khưu ấy nói đúng Pháp, tỳ khưu ấy nói đúng Luật,
chandañca ruciñca ādāya voharati, jānāti, no bhāsati, amhākampetaṃ khamatī”ti, [5.6]
tỳ khưu ấy nói theo sự mong muốn và sở thích của chúng tôi, vị ấy biết nên nói, và điều ấy hợp ý chúng tôi".
te bhikkhū bhikkhūhi evamassu vacanīyā [2.7]
Các tỳ khưu ấy cần được các tỳ khưu khuyên bảo như vầy:
“mā āyasmanto evaṃ avacuttha, [2.5]
"Xin các đại đức chớ nên nói như thế,
na ceso bhikkhu dhammavādī, na ceso bhikkhu vinayavādī, [3.8]
bởi tỳ khưu ấy không nói đúng Pháp, tỳ khưu ấy không nói đúng Luật,
mā āyasmantānampi saṅghabhedo ruccittha, [3.2]
các đại đức chớ nên thích việc chia rẽ Tăng chúng,
sametāyasmantānaṃ saṅghena, [2.5]
các đại đức hãy hòa hợp với Tăng chúng,
samaggo hi saṅgho sammodamāno avivadamāno [3.4]
vì Tăng chúng hòa hợp, hoan hỷ, không tranh cãi,
ekuddeso phāsu viharatī”ti, [2.6]
cùng chung một giới bổn, sẽ sống an lạc".
evañca te bhikkhū bhikkhūhi vuccamānā tatheva paggaṇheyyuṃ, [3.9]
Dầu được các tỳ khưu khuyên bảo như vậy, nhưng các tỳ khưu ấy vẫn cố thủ như thế,
te bhikkhū bhikkhūhi yāvatatiyaṃ samanubhāsitabbā tassa paṭinissaggāya, [4.7]
thì các tỳ khưu ấy cần được các tỳ khưu can gián cho đến lần thứ ba để từ bỏ việc ấy.
yāvatatiyañce samanubhāsiyamānā taṃ paṭinissajjeyyuṃ, iccetaṃ kusalaṃ, [4.7]
Nếu đang được can gián cho đến lần thứ ba mà từ bỏ được, thời như vậy là tốt đẹp.
no ce paṭinissajjeyyuṃ, saṅghādiseso. [3.6]
Nếu không từ bỏ, thì phạm tội Tăng Tàn.`
},

{
    id: 'Sg.12', title: 'Saṅghādisesa 12', audio: '2Sg-12.mp3',
    text: `Bhikkhu paneva dubbacajātiko hoti uddesapariyāpannesu [4.0]
Lại nữa, nếu tỳ khưu có bản tính khó dạy,
sikkhāpadesu bhikkhūhi sahadhammikaṃ vuccamāno [3.3]
khi được các tỳ khưu khuyên bảo đúng pháp về các điều học trong giới bổn,
attānaṃ avacanīyaṃ karoti [2.4]
lại tự biến mình thành người không thể khuyên bảo được (bằng cách nói):
“mā maṃ āyasmanto kiñci avacuttha [2.9]
"Xin các đại đức chớ nói điều chi đến tôi,
kalyāṇaṃ vā pāpakaṃ vā, ahampāyasmante na kiñci vakkhāmi kalyāṇaṃ vā pāpakaṃ vā, [5.9]
dầu tốt hay xấu, tôi cũng sẽ không nói gì đến các đại đức, dầu tốt hay xấu.
viramathāyasmanto mama vacanāyā”ti, [3.1]
Xin các đại đức hãy thôi nói với tôi đi".
so bhikkhu bhikkhūhi evamassa vacanīyo [2.7]
Tỳ khưu ấy cần được các tỳ khưu khuyên bảo như vầy:
“mā āyasmā attānaṃ avacanīyaṃ akāsi, vacanīyamevāyasmā attānaṃ karotu, [6.1]
"Xin đại đức chớ tự biến mình thành người không thể khuyên bảo; hãy tự biến mình thành người dễ khuyên bảo.
āyasmāpi bhikkhū vadatu sahadhammena, bhikkhūpi āyasmantaṃ vakkhanti sahadhammena, [5.6]
Đại đức hãy nói với các tỳ khưu đúng pháp, và các tỳ khưu cũng sẽ nói với đại đức đúng pháp.
evaṃ saṃvaddhā hi tassa bhagavato parisā [3.1]
Vì hội chúng của Đức Thế Tôn được hưng thịnh như thế này,
yadidaṃ aññamaññavacanena aññamaññavuṭṭhāpanenā”ti, [4.0]
tức là do sự khuyên bảo lẫn nhau, do sự nâng đỡ lẫn nhau".
evañca so bhikkhu bhikkhūhi vuccamāno tatheva paggaṇheyya, [3.7]
Dầu được các tỳ khưu khuyên bảo như vậy, nhưng tỳ khưu ấy vẫn cố thủ như thế,
so bhikkhu bhikkhūhi yāvatatiyaṃ samanubhāsitabbo tassa paṭinissaggāya, [4.7]
thì tỳ khưu ấy cần được các tỳ khưu can gián cho đến lần thứ ba để từ bỏ việc ấy.
yāvatatiyañce samanubhāsiyamāno taṃ paṭinissajjeyya, iccetaṃ kusalaṃ, [4.6]
Nếu đang được can gián cho đến lần thứ ba mà từ bỏ được, thời như vậy là tốt đẹp.
no ce paṭinissajjeyya, saṅghādiseso. [4.0]
Nếu không từ bỏ, thì phạm tội Tăng Tàn.`
},

{
    id: 'Sg.13', title: 'Saṅghādisesa 13', audio: '2Sg-13.mp3',
    text: `Bhikkhu paneva aññataraṃ gāmaṃ vā nigamaṃ vā upanissāya viharati [4.82]
Lại nữa, có tỳ khưu sống nương nhờ vào một làng hay một thị trấn nọ,
kuladūsako pāpasamācāro, [2.2]
là vị làm hư hỏng các gia đình, có hành vi xấu ác,
tassa kho pāpakā samācārā dissanti ceva suyyanti ca, [3.75]
những hành vi xấu ác của vị ấy người ta đều thấy và nghe biết,
kulāni ca tena duṭṭhāni dissanti ceva suyyanti ca, [3.5]
các gia đình bị vị ấy làm cho hư hỏng người ta cũng thấy và nghe biết.
so bhikkhu bhikkhūhi evamassa vacanīyo [2.75]
Tỳ khưu ấy cần được các tỳ khưu khuyên bảo như vầy:
“āyasmā kho kuladūsako pāpasamācāro, [3.0]
"Đại đức là vị làm hư hỏng các gia đình, có hành vi xấu ác,
āyasmato kho pāpakā samācārā dissanti ceva suyyanti ca, [4.2]
những hành vi xấu ác của đại đức người ta đều thấy và nghe biết,
kulāni cāyasmatā duṭṭhāni dissanti ceva suyyanti ca, [3.5]
các gia đình bị đại đức làm cho hư hỏng người ta cũng thấy và nghe biết.
pakkamatāyasmā imamhā āvāsā, alaṃ te idha vāsenā”ti, [4.6]
Đại đức hãy rời khỏi trú xứ này đi, đại đức không nên ở đây nữa".
evañca so bhikkhu bhikkhūhi vuccamāno te bhikkhū evaṃ vadeyya [4.2]
Dầu được các tỳ khưu khuyên bảo như vậy, tỳ khưu ấy lại nói với các tỳ khưu ấy như vầy:
“chandagāmino ca bhikkhū, dosagāmino ca bhikkhū, mohagāmino ca bhikkhū, bhayagāmino ca bhikkhū [5.5]
"Các tỳ khưu là những vị hành động theo thiên vị, hành động theo sân hận, hành động theo si mê, hành động theo sợ hãi.
tādisikāya āpattiyā ekaccaṃ pabbājenti, ekaccaṃ na pabbājentī”ti, [5.0]
Cùng một loại tội như nhau mà các vị đuổi người này, không đuổi người kia".
so bhikkhu bhikkhūhi evamassa vacanīyo [2.6]
Tỳ khưu ấy cần được các tỳ khưu khuyên bảo như vầy:
“mā āyasmā evaṃ avaca, na ca bhikkhū chandagāmino, na ca bhikkhū dosagāmino, [4.85]
"Xin đại đức chớ có nói như thế. Các tỳ khưu không hành động theo thiên vị, không hành động theo sân hận,
na ca bhikkhū mohagāmino, na ca bhikkhū bhayagāmino, āyasmā kho kuladūsako pāpasamācāro, [6.0]
không hành động theo si mê, không hành động theo sợ hãi. Chính đại đức là vị làm hư hỏng các gia đình, có hành vi xấu ác,
āyasmato kho pāpakā samācārā dissanti ceva suyyanti ca, [4.1]
những hành vi xấu ác của đại đức người ta đều thấy và nghe biết,
kulāni cāyasmatā duṭṭhāni dissanti ceva suyyanti ca, [3.5]
các gia đình bị đại đức làm cho hư hỏng người ta cũng thấy và nghe biết.
pakkamatāyasmā imamhā āvāsā, alaṃ te idha vāsenā”ti, [4.8]
Đại đức hãy rời khỏi trú xứ này đi, đại đức không nên ở đây nữa".
evañca so bhikkhu bhikkhūhi vuccamāno tatheva paggaṇheyya, [3.9]
Dầu được các tỳ khưu khuyên bảo như vậy, nhưng tỳ khưu ấy vẫn cố thủ như thế,
so bhikkhu bhikkhūhi yāvatatiyaṃ samanubhāsitabbo tassa paṭinissaggāya, [4.5]
thì tỳ khưu ấy cần được các tỳ khưu can gián cho đến lần thứ ba để từ bỏ việc ấy.
yāvatatiyañce samanubhāsiyamāno taṃ paṭinissajjeyya, iccetaṃ kusalaṃ, [4.4]
Nếu đang được can gián cho đến lần thứ ba mà từ bỏ được, thời như vậy là tốt đẹp.
no ce paṭinissajjeyya, saṅghādiseso. [3.6]
Nếu không từ bỏ, thì phạm tội Tăng Tàn.`
},

{
    id: 'Sg.U', title: 'Saṅghādisesa Uddiṭṭhā', audio: '2Sg-U.mp3',
    text: `Uddiṭṭhā kho āyasmanto terasa saṅghādisesā dhammā [3.7]
Này các đại đức, mười ba pháp Tăng Tàn đã được tụng đọc xong,
nava paṭhamāpattikā, cattāro yāvatatiyakā. [3.1]
chín điều phạm tội ngay lần đầu, bốn điều phạm tội đến lần thứ ba.
Yesaṃ bhikkhu aññataraṃ vā aññataraṃ vā āpajjitvā [3.8]
Vị tỳ khưu nào phạm vào một trong các tội ấy,
yāvatīhaṃ jānaṃ paṭicchādeti, [2.5]
biết mà che giấu trong bao nhiêu ngày,
tāvatīhaṃ tena bhikkhunā akāmā parivatthabbaṃ. [3.4]
thì tỳ khưu ấy phải sống biệt trú (Parivāsa) trong bấy nhiêu ngày dù không muốn.
Parivutthaparivāsena bhikkhunā uttariṃ chārattaṃ bhikkhumānattāya paṭipajjitabbaṃ, [5.4]
Vị tỳ khưu sau khi đã sống biệt trú xong, phải thực hành thêm sáu đêm pháp Mānatta.
ciṇṇamānatto bhikkhu yattha siyā vīsatigaṇo bhikkhusaṅgho, [3.9]
Vị tỳ khưu đã thực hành xong pháp Mānatta, nơi nào có hội chúng tỳ khưu đủ hai mươi vị,
tattha so bhikkhu abbhetabbo. [2.5]
thì tỳ khưu ấy cần được giải tội (Abbhāna) tại nơi đó.
Ekenapi ce ūno vīsatigaṇo bhikkhusaṅgho taṃ bhikkhuṃ abbheyya, [4.2]
Nếu hội chúng tỳ khưu thiếu dù chỉ một người cho đủ hai mươi vị mà giải tội cho tỳ khưu ấy,
so ca bhikkhu anabbhito, te ca bhikkhū gārayhā, ayaṃ tattha sāmīci. [4.8]
thì tỳ khưu ấy vẫn chưa được giải tội, và các tỳ khưu ấy đáng bị khiển trách; đây là phương cách đúng đắn trong trường hợp này.
Tatthāyasmante pucchāmi, kaccittha parisuddhā, dutiyampi pucchāmi, kaccittha parisuddhā, [5.5]
Trong phần này tôi xin hỏi các đại đức: Các đại đức có trong sạch không? Tôi xin hỏi lần thứ nhì: Các đại đức có trong sạch không?
tatiyampi pucchāmi, kaccittha parisuddhā, [2.6]
Tôi xin hỏi lần thứ ba: Các đại đức có trong sạch không?
parisuddhetthāyasmanto, tasmā tuṇhī, evametaṃ dhārayāmīti. [4.9]
Các đại đức trong sạch, do đó mới im lặng. Tôi xin ghi nhận sự việc như vậy.
Saṅghādisesuddeso tatiyo [3.6]
Phần tụng đọc về tội Tăng Tàn là phần thứ ba.`
},


 



{
    id: 'Ay.1', title: 'Aniyata 1', audio: '3Ay-01.mp3',
    text: `Ime kho panāyasmanto dve aniyatā dhammā uddesaṃ āgacchanti. [5.1]
Này các đại đức, đây là hai pháp Bất Định được tụng đọc đến.
Yo pana bhikkhu mātugāmena saddhiṃ eko ekāya raho paṭicchanne āsane alaṃkammaniye nisajjaṃ kappeyya, [6.7]
Vị tỳ khưu nào cùng với một người nữ, ngồi ở nơi khuất tầm mắt, trên chỗ ngồi kín đáo và tiện lợi cho việc hành dâm,
tamenaṃ saddheyyavacasā upāsikā disvā tiṇṇaṃ dhammānaṃ aññatarena vadeyya [4.7]
có một cận sự nữ đáng tin cậy nhìn thấy và nói đến một trong ba tội:
pārājikena vā saṅghādisesena vā pācittiyena vā, [3.4]
hoặc tội Bất Cộng Trụ, hoặc tội Tăng Tàn, hoặc tội Ưng Đối Trị;
nisajjaṃ bhikkhu paṭijānamāno tiṇṇaṃ dhammānaṃ aññatarena kāretabbo [4.6]
nếu vị tỳ khưu thừa nhận có ngồi, thì cần được xử lý theo một trong ba tội ấy:
pārājikena vā saṅghādisesena vā pācittiyena vā, [3.6]
hoặc tội Bất Cộng Trụ, hoặc tội Tăng Tàn, hoặc tội Ưng Đối Trị;
yena vā sā saddheyyavacasā upāsikā vadeyya, tena so bhikkhu kāretabbo, [4.8]
hoặc vị tỳ khưu cần được xử lý theo tội mà vị cận sự nữ đáng tin cậy ấy đã nói;
ayaṃ dhammo aniyato. [2.7]
pháp này gọi là Bất Định.`
},

{
    id: 'Ay.2', title: 'Aniyata 2', audio: '3Ay-02.mp3',
    text: `Na heva kho pana paṭicchannaṃ āsanaṃ hoti nālaṃkammaniyaṃ, [4.2]
Lại nữa, nếu chỗ ngồi ấy không phải là nơi khuất tầm mắt và không tiện lợi cho việc hành dâm,
alañca kho hoti mātugāmaṃ duṭṭhullāhi vācāhi obhāsituṃ, [4.1]
nhưng là nơi có thể tán tỉnh người nữ bằng những lời thô tục,
yo pana bhikkhu tathārūpe āsane mātugāmena saddhiṃ eko ekāya raho nisajjaṃ kappeyya, [5.9]
vị tỳ khưu nào ngồi ở nơi như thế cùng với một người nữ,
tamenaṃ saddheyyavacasā upāsikā disvā dvinnaṃ dhammānaṃ aññatarena vadeyya [4.8]
có một cận sự nữ đáng tin cậy nhìn thấy và nói đến một trong hai tội:
saṅghādisesena vā pācittiyena vā, [2.5] 
hoặc tội Tăng Tàn, hoặc tội Ưng Đối Trị;
nisajjaṃ bhikkhu paṭijānamāno dvinnaṃ dhammānaṃ aññatarena kāretabbo [4.5] 
nếu vị tỳ khưu thừa nhận có ngồi, thì cần được xử lý theo một trong hai tội ấy:
saṅghādisesena vā pācittiyena vā, [2.6]
hoặc tội Tăng Tàn, hoặc tội Ưng Đối Trị;
yena vā sā saddheyyavacasā upāsikā vadeyya, tena so bhikkhu kāretabbo, ayampi dhammo aniyato. [7.2]
hoặc vị tỳ khưu cần được xử lý theo tội mà vị cận sự nữ đáng tin cậy ấy đã nói; pháp này cũng gọi là Bất Định.`
},

{
    id: 'Ay.U', title: 'Aniyata Uddiṭṭhā', audio: '3Ay-U.mp3',
    text: `Uddiṭṭhā kho āyasmanto dve aniyatā dhammā. Tatthāyasmante pucchāmi, kaccittha parisuddhā, [6.2]
Này các đại đức, hai pháp Bất Định đã được tụng đọc xong. Trong phần này tôi xin hỏi các đại đức: Các đại đức có trong sạch không?
dutiyampi pucchāmi, kaccittha parisuddhā, tatiyampi pucchāmi, kaccittha parisuddhā, [4.5]
Tôi xin hỏi lần thứ nhì: Các đại đức có trong sạch không? Tôi xin hỏi lần thứ ba: Các đại đức có trong sạch không?
parisuddhetthāyasmanto, tasmā tuṇhī, evametaṃ dhārayāmīti. [4.6]
Các đại đức trong sạch, do đó mới im lặng. Tôi xin ghi nhận sự việc như vậy.
Aniyatuddeso catuttho [3.0]
Phần tụng đọc về các pháp Bất Định là phần thứ tư.`
},

{
    id: 'NP.1', title: 'Nissaggiya Pācittiya 1', audio: '4NP-01.mp3',
    text: `Ime kho panāyasmanto tiṃsa nissaggiyā pācittiyā Dhammā uddesaṃ āgacchanti. [5.8]
Này các đại đức, đây là ba mươi pháp Ưng Xả Đối Trị được tụng đọc đến.
Niṭṭhitacīvarasmiṃ bhikkhunā ubbhatasmiṃ kaṭhine dasāhaparamaṃ atirekacīvaraṃ dhāretabbaṃ, [5.6]
Khi y đã làm xong, sau khi lễ Kaṭhina đã hoàn tất, vị tỳ khưu có thể cất giữ y dư tối đa là mười ngày,
taṃ atikkāmayato nissaggiyaṃ pācittiyaṃ. [3.5]
nếu để quá thời hạn ấy, thì phạm tội Ưng Xả Đối Trị.`
},

{
    id: 'NP.2', title: 'Nissaggiya Pācittiya 2', audio: '4NP-02.mp3',
    text: `Niṭṭhitacīvarasmiṃ bhikkhunā ubbhatasmiṃ kaṭhine ekarattampi ce bhikkhu ticīvarena vippavaseyya, aññatra bhikkhusammutiyā nissaggiyaṃ pācittiyaṃ. [9.0]
Khi y đã làm xong, sau khi lễ Kaṭhina đã hoàn tất, nếu vị tỳ khưu sống lìa khỏi tam y dù chỉ một đêm, trừ khi được sự cho phép của Tăng chúng, thì phạm tội Ưng Xả Đối Trị.`
},

{
    id: 'NP.3', title: 'Nissaggiya Pācittiya 3', audio: '4NP-03.mp3',
    text: `Niṭṭhitacīvarasmiṃ bhikkhunā ubbhatasmiṃ kaṭhine bhikkhuno paneva akālacīvaraṃ uppajjeyya, [5.6]
Khi y đã làm xong, sau khi lễ Kaṭhina đã hoàn tất, nếu có "y ngoài hạn kỳ" phát sinh đến cho vị tỳ khưu,
ākaṅkhamānena bhikkhunā paṭiggahetabbaṃ, paṭiggahetvā khippameva kāretabbaṃ, [5.0]
vị tỳ khưu nếu muốn thì hãy thọ nhận; sau khi thọ nhận rồi, phải mau chóng làm thành y,
no cassa pāripūri, māsaparamaṃ tena bhikkhunā taṃ cīvaraṃ nikkhipitabbaṃ [4.7]
nếu chưa đủ (vải), vị tỳ khưu ấy có thể cất giữ miếng vải ấy tối đa là một tháng
ūnassa pāripūriyā satiyā paccāsāya. Tato ce uttariṃ nikkhipeyya satiyāpi paccāsāya, nissaggiyaṃ pācittiyaṃ. [7.0]
với hy vọng sẽ có thêm cho đủ. Nếu cất giữ quá thời hạn ấy, dù vẫn còn hy vọng, thì phạm tội Ưng Xả Đối Trị.`
},

{
    id: 'NP.4', title: 'Nissaggiya Pācittiya 4', audio: '4NP-04.mp3',
    text: `Yo pana bhikkhu aññātikāya bhikkhuniyā purāṇacīvaraṃ dhovāpeyya vā rajāpeyya vā ākoṭāpeyya vā, nissaggiyaṃ pācittiyaṃ. [8.0]
Vị tỳ khưu nào bảo tỳ khưu ni không phải thân quyến giặt, hoặc nhuộm, hoặc đập giũ y cũ, thì phạm tội Ưng Xả Đối Trị.`
},

{
    id: 'NP.5', title: 'Nissaggiya Pācittiya 5', audio: '4NP-05.mp3',
    text: `Yo pana bhikkhu aññātikāya bhikkhuniyā hatthato cīvaraṃ paṭiggaṇheyya aññatra pārivattakā, nissaggiyaṃ pācittiyaṃ. [8.0]
Vị tỳ khưu nào thọ nhận y từ tay của tỳ khưu ni không phải thân quyến, trừ khi có sự trao đổi y, thì phạm tội Ưng Xả Đối Trị.`
},

{
    id: 'NP.6', title: 'Nissaggiya Pācittiya 6', audio: '4NP-06.mp3',
    text: `Yo pana bhikkhu aññātakaṃ gahapatiṃ vā gahapatāniṃ vā cīvaraṃ viññāpeyya [4.8]
Vị tỳ khưu nào xin y nơi người nam gia chủ hoặc người nữ gia chủ không phải thân quyến,
aññatra samayā, nissaggiyaṃ pācittiyaṃ. [2.6]
ngoại trừ vào lúc thích hợp, thì phạm tội Ưng Xả Đối Trị.
Tatthāyaṃ samayo: acchinnacīvaro vā hoti bhikkhu, naṭṭhacīvaro vā, ayaṃ tattha samayo. [6.5]
Lúc thích hợp ở đây là: vị tỳ khưu bị cướp mất y hoặc bị thất lạc y; đó là lúc thích hợp trong trường hợp này.`
},

{
    id: 'NP.7', title: 'Nissaggiya Pācittiya 7', audio: '4NP-07.mp3',
    text: `Tañce aññātako gahapati vā gahapatānī vā bahūhi cīvarehi abhihaṭṭhuṃ pavāreyya, [5.9]
Nếu người nam gia chủ hoặc người nữ gia chủ không phải thân quyến ấy dâng cúng đến vị tỳ khưu rất nhiều y,
santaruttaraparamaṃ tena bhikkhunā tato cīvaraṃ sāditabbaṃ. Tato ce uttariṃ sādiyeyya, nissaggiyaṃ pācittiyaṃ. [7.0]
vị tỳ khưu ấy chỉ nên thọ nhận tối đa là một bộ y (y nội và y vai trái). Nếu thọ nhận quá mức ấy, thì phạm tội Ưng Xả Đối Trị.`
},

{
    id: 'NP.8', title: 'Nissaggiya Pācittiya 8', audio: '4NP-08.mp3',
    text: `Bhikkhuṃ paneva uddissa aññātakassa gahapatissa vā gahapatāniyā vā cīvaracetāpannaṃ upakkhaṭaṃ hoti [6.6]
Lại nữa, có người nam gia chủ hoặc người nữ gia chủ không phải thân quyến chuẩn bị sẵn khoản tiền mua y để dành riêng cho một vị tỳ khưu (với ý nghĩ):
“iminā cīvaracetāpannena cīvaraṃ cetāpetvā itthannāmaṃ bhikkhuṃ cīvarena acchādessāmī”ti, [7.0]
"Với khoản tiền mua y này, ta sẽ mua một tấm y để dâng đến vị tỳ khưu có tên như thế này",
tatra ce so bhikkhu pubbe appavārito upasaṅkamitvā cīvare vikappaṃ āpajjeyya [5.5]
nếu vị tỳ khưu ấy, khi chưa được mời trước, lại đến gặp họ và đưa ra yêu cầu về tấm y rằng:
“sādhu vata maṃ āyasmā iminā cīvaracetāpannena [3.4]
"Tốt thay, xin đại đức hãy dùng khoản tiền mua y này,
evarūpaṃ vā evarūpaṃ vā cīvaraṃ cetāpetvā acchādehī”ti [4.6]
mua tấm y như thế này hoặc như thế này rồi dâng đến tôi",
kalyāṇakamyataṃ upādāya, nissaggiyaṃ pācittiyaṃ. [4.0]
vì mong muốn có được đồ tốt, thì phạm tội Ưng Xả Đối Trị.`
},

{
    id: 'NP.9', title: 'Nissaggiya Pācittiya 9', audio: '4NP-09.mp3',
    text: `Bhikkhuṃ paneva uddissa ubhinnaṃ aññātakānaṃ gahapatīnaṃ vā gahapatānīnaṃ vā paccekacīvaracetāpannāni upakkhaṭāni honti [8.2]
Lại nữa, có hai người nam gia chủ hoặc hai người nữ gia chủ không phải thân quyến chuẩn bị sẵn các khoản tiền mua y riêng biệt để dành riêng cho một vị tỳ khưu (với ý nghĩ):
“imehi mayaṃ paccekacīvaracetāpannehi paccekacīvarāni cetāpetvā itthannāmaṃ bhikkhuṃ [5.9]
"Với những khoản tiền mua y riêng biệt này, chúng ta sẽ mua những tấm y riêng biệt để dâng đến vị tỳ khưu có tên như thế này",
cīvarehi acchādessāmā”ti, [2.3]
dâng cúng đến vị ấy các tấm y",
tatra ce so bhikkhu pubbe appavārito upasaṅkamitvā [3.8]
nếu vị tỳ khưu ấy, khi chưa được mời trước, lại đến gặp họ
cīvare vikappaṃ āpajjeyya [2.1]
và đưa ra yêu cầu về tấm y rằng:
“sādhu vata maṃ āyasmanto imehi paccekacīvaracetāpannehi evarūpaṃ vā evarūpaṃ vā cīvaraṃ cetāpetvā [6.8]
"Tốt thay, xin các đại đức hãy dùng những khoản tiền mua y riêng biệt này mua tấm y như thế này hoặc như thế này,
acchādetha ubhova santā ekenā”ti kalyāṇakamyataṃ upādāya, nissaggiyaṃ pācittiyaṃ. [7.0]
rồi cả hai cùng dâng đến tôi chung một tấm y thôi", vì mong muốn có được đồ tốt, thì phạm tội Ưng Xả Đối Trị.`
},

{
    id: 'NP.10', title: 'Nissaggiya Pācittiya 10', audio: '4NP-10.mp3',
    text: `Bhikkhuṃ paneva uddissa rājā vā rājabhoggo vā brāhmaṇo vā gahapatiko vā dūtena cīvaracetāpannaṃ pahiṇeyya [7.1]
Lại nữa, có đức vua, hoặc quan đại thần, hoặc bà-la-môn, hoặc gia chủ gởi khoản tiền mua y qua một người sứ giả để dành riêng cho một vị tỳ khưu (với lời nhắn):
“iminā cīvaracetāpannena cīvaraṃ cetāpetvā itthannāmaṃ bhikkhuṃ cīvarena acchādehī”ti. [6.1]
"Hãy dùng khoản tiền mua y này để mua tấm y dâng đến vị tỳ khưu có tên như thế này".
So ce dūto taṃ bhikkhuṃ upasaṅkamitvā evaṃ vadeyya [3.8]
Nếu người sứ giả ấy đến gặp vị tỳ khưu ấy và nói như vầy:
“idaṃ kho, bhante, āyasmantaṃ uddissa cīvaracetāpannaṃ ābhataṃ, [4.6]
"Bạch ngài, đây là khoản tiền mua y được mang đến dành cho ngài,
paṭiggaṇhātu āyasmā cīvaracetāpanna”nti. [3.3]
xin ngài hãy thọ nhận khoản tiền mua y này".
Tena bhikkhunā so dūto evamassa vacanīyo [2.9]
Sứ giả ấy cần được vị tỳ khưu ấy trả lời như vầy:
“na kho mayaṃ, āvuso, cīvaracetāpannaṃ paṭiggaṇhāma, [3.6]
"Này đạo hữu, chúng tôi không được phép thọ nhận tiền mua y,
cīvarañca kho mayaṃ paṭiggaṇhāma kālena kappiya”nti. [3.4]
nhưng chúng tôi thọ nhận y đúng thời và hợp lẽ".
So ce dūto taṃ bhikkhuṃ evaṃ vadeyya “atthi panāyasmato koci veyyāvaccakaro”ti. [5.3]
Nếu sứ giả ấy thưa với vị tỳ khưu ấy rằng: "Bạch ngài, ngài có người hộ độ nào không?".
Cīvaratthikena, bhikkhave, bhikkhunā veyyāvaccakaro niddisitabbo [4.1]
Này các tỳ khưu, vị tỳ khưu đang cần y nên chỉ ra một người hộ độ,
ārāmiko vā upāsako vā “eso kho, āvuso, bhikkhūnaṃ veyyāvaccakaro”ti. [5.2]
là người làm công trong chùa hoặc một cận sự nam rằng: "Này đạo hữu, đây là người hộ độ của các tỳ khưu".
So ce dūto taṃ veyyāvaccakaraṃ saññāpetvā taṃ bhikkhuṃ upasaṅkamitvā evaṃ vadeyya [5.4]
Nếu sứ giả ấy sau khi đã bàn bạc với người hộ độ, rồi đi đến gặp vị tỳ khưu và nói như vầy:
“yaṃ kho, bhante, āyasmā veyyāvaccakaraṃ niddisi, saññatto so mayā, [4.8]
"Bạch ngài, người hộ độ mà ngài đã chỉ, tôi đã bàn bạc xong rồi.
upasaṅkamatāyasmā kālena, cīvarena taṃ acchādessatī”ti. [4.4]
Đến thời điểm thích hợp xin ngài hãy đến gặp, người ấy sẽ dâng y đến ngài".
Cīvaratthikena, bhikkhave, bhikkhunā veyyāvaccakaro upasaṅkamitvā dvattikkhattuṃ codetabbo sāretabbo [6.5]
Này các tỳ khưu, vị tỳ khưu đang cần y khi đến gặp người hộ độ, có thể nhắc nhở và yêu cầu đến hai hoặc ba lần rằng:
“attho me, āvuso, cīvarenā”ti, [2.6]
"Này đạo hữu, tôi đang cần y".
dvattikkhattuṃ codayamāno sārayamāno taṃ cīvaraṃ abhinipphādeyya, iccetaṃ kusalaṃ, [5.5]
Nếu nhắc nhở và yêu cầu đến hai hoặc ba lần mà có được y, thời như vậy là tốt đẹp.
no ce abhinipphādeyya, catukkhattuṃ pañcakkhattuṃ chakkhattuparamaṃ tuṇhībhūtena uddissa ṭhātabbaṃ, [6.1]
Nếu không có được y, thì vị ấy nên đến đứng yên lặng trước mặt người hộ độ bốn lần, năm lần, tối đa là sáu lần.
catukkhattuṃ pañcakkhattuṃ chakkhattuparamaṃ tuṇhībhūto uddissa tiṭṭhamāno taṃ cīvaraṃ abhinipphādeyya, [6.3]
Nếu đứng yên lặng như vậy bốn lần, năm lần, tối đa là sáu lần mà có được y,
iccetaṃ kusalaṃ, [1.5]
thời như vậy là tốt đẹp.
tato ce uttari vāyamamāno taṃ cīvaraṃ abhinipphādeyya, nissaggiyaṃ pācittiyaṃ. [5.2]
Nếu cố gắng quá mức ấy mà có được y, thì phạm tội Ưng Xả Đối Trị.
No ce abhinipphādeyya, yatassa cīvaracetāpannaṃ ābhataṃ, tattha sāmaṃ vā gantabbaṃ, dūto vā pāhetabbo [7.1]
Nếu vẫn không có được y, thì vị tỳ khưu ấy phải tự mình đi đến hoặc gởi sứ giả đến nơi mà khoản tiền mua y đã được gởi đi để báo rằng:
“yaṃ kho tumhe āyasmanto bhikkhuṃ uddissa cīvaracetāpannaṃ pahiṇittha, [4.9]
"Khoản tiền mua y mà các đại đức đã gởi đến dành cho vị tỳ khưu ấy,
na taṃ tassa bhikkhuno kiñci atthaṃ anubhoti, [3.1]
không đem lại lợi ích gì cho vị tỳ khưu ấy cả.
yuñjantāyasmanto sakaṃ, mā vo sakaṃ vinassā”ti, ayaṃ tattha sāmīci. [4.9]
Các đại đức hãy đi lấy lại tài sản của mình, chớ để tài sản của các vị bị thất thoát". Đây là phương cách đúng đắn trong trường hợp này.
Cīvaravaggo paṭhamo [2.6]
Chương về Y là chương thứ nhất.`
},

{
    id: 'NP.12', title: 'Nissaggiya Pācittiya 12', audio: '4NP-12.mp3',
    text: `Yo pana bhikkhu suddhakāḷakānaṃ eḷakalomānaṃ santhataṃ kārāpeyya, nissaggiyaṃ pācittiyaṃ. [6.0]
Vị tỳ khưu nào làm tấm thảm tọa cụ bằng lông cừu thuần đen, thì phạm tội Ưng Xả Đối Trị.`
},

{
    id: 'NP.13', title: 'Nissaggiya Pācittiya 13', audio: '4NP-13.mp3',
    text: `Navaṃ pana bhikkhunā santhataṃ kārayamānena dve bhāgā suddhakāḷakānaṃ eḷakalomānaṃ ādātabbā, [6.3]
Khi vị tỳ khưu làm tấm thảm tọa cụ mới, phải dùng hai phần lông cừu thuần đen,
tatiyaṃ odātānaṃ, catutthaṃ gocariyānaṃ. [2.9]
một phần ba là lông trắng, và một phần tư là lông màu đỏ nâu (màu da bò).
Anādā ce bhikkhu dve bhāge suddhakāḷakānaṃ eḷakalomānaṃ, tatiyaṃ odātānaṃ, catutthaṃ gocariyānaṃ, [6.4]
Nếu vị tỳ khưu không dùng hai phần lông cừu thuần đen, một phần ba lông trắng, một phần tư lông màu đỏ nâu
navaṃ santhataṃ kārāpeyya, nissaggiyaṃ pācittiyaṃ. [3.8]
mà làm tấm thảm tọa cụ mới, thì phạm tội Ưng Xả Đối Trị.`
},

{
    id: 'NP.14', title: 'Nissaggiya Pācittiya 14', audio: '4NP-14.mp3',
    text: `Navaṃ pana bhikkhunā santhataṃ kārāpetvā chabbassāni dhāretabbaṃ, [4.3]
Vị tỳ khưu sau khi làm tấm thảm tọa cụ mới, phải sử dụng trong sáu năm.
orena ce channaṃ vassānaṃ taṃ santhataṃ vissajjetvā vā avissajjetvā vā aññaṃ navaṃ santhataṃ kārāpeyya [6.5]
Trong vòng chưa đầy sáu năm, dù đã bỏ hay chưa bỏ tấm thảm cũ mà lại làm một tấm thảm tọa cụ mới khác,
aññatra bhikkhusammutiyā, nissaggiyaṃ pācittiyaṃ. [4.0]
ngoại trừ khi được sự cho phép của Tăng chúng, thì phạm tội Ưng Xả Đối Trị.`
},

{
    id: 'NP.15', title: 'Nissaggiya Pācittiya 15', audio: '4NP-15.mp3',
    text: `Nisīdanasanthataṃ pana bhikkhunā kārayamānena purāṇasanthatassa sāmantā sugatavidatthi ādātabbā dubbaṇṇakaraṇāya. [7.1]
Khi vị tỳ khưu làm tấm thảm tọa cụ mới, nên lấy một miếng từ tấm tọa cụ cũ cỡ một gang tay của Đức Thế Tôn đắp vào xung quanh để làm cho nó mất màu (xấu đi).
Anādā ce bhikkhu purāṇasanthatassa sāmantā sugatavidatthiṃ, navaṃ nisīdanasanthataṃ kārāpeyya, nissaggiyaṃ pācittiyaṃ. [7.5]
Nếu vị tỳ khưu không lấy một miếng từ tấm tọa cụ cũ cỡ một gang tay của Đức Thế Tôn mà làm tọa cụ mới, thì phạm tội Ưng Xả Đối Trị.`
},

{
    id: 'NP.16', title: 'Nissaggiya Pācittiya 16', audio: '4NP-16.mp3',
    text: `Bhikkhuno paneva addhānamaggappaṭipannassa eḷakalomāni uppajjeyyuṃ, [4.2]
Lại nữa, nếu vị tỳ khưu đang đi trên đường xa mà có lông cừu phát sinh đến,
ākaṅkhamānena bhikkhunā paṭiggahetabbāni, paṭiggahetvā tiyojanaparamaṃ sahatthā haritabbāni asante hārake. [6.6]
vị tỳ khưu nếu muốn thì hãy thọ nhận; sau khi thọ nhận rồi, nếu không có người mang giúp, vị ấy có thể tự tay mang đi tối đa là ba do-tuần (yojana).
Tato ce uttariṃ hareyya, asantepi hārake, nissaggiyaṃ pācittiyaṃ. [4.5]
Nếu tự tay mang đi quá giới hạn ấy, dù là không có người mang giúp, thì phạm tội Ưng Xả Đối Trị.`
},

{
    id: 'NP.17', title: 'Nissaggiya Pācittiya 17', audio: '4NP-17.mp3',
    text: `Yo pana bhikkhu aññātikāya bhikkhuniyā eḷakalomāni dhovāpeyya vā rajāpeyya vā vijaṭāpeyya vā, nissaggiyaṃ pācittiyaṃ. [7.3]
Vị tỳ khưu nào bảo tỳ khưu ni không phải thân quyến giặt, hoặc nhuộm, hoặc chải lông cừu, thì phạm tội Ưng Xả Đối Trị.`
},

{
    id: 'NP.18', title: 'Nissaggiya Pācittiya 18', audio: '4NP-18.mp3',
    text: `Yo pana bhikkhu jātarūparajataṃ uggaṇheyya vā uggaṇhāpeyya vā upanikkhittaṃ vā sādiyeyya, nissaggiyaṃ pācittiyaṃ. [7.0]
Vị tỳ khưu nào tự mình thọ nhận vàng bạc, hoặc bảo người khác thọ nhận, hoặc đồng ý với vật được cất giữ dành cho mình, thì phạm tội Ưng Xả Đối Trị.`
},

{
    id: 'NP.19', title: 'Nissaggiya Pācittiya 19', audio: '4NP-19.mp3',
    text: `Yo pana bhikkhu nānappakārakaṃ rūpiyasaṃvohāraṃ samāpajjeyya, nissaggiyaṃ pācittiyaṃ. [5.6]
Vị tỳ khưu nào thực hiện việc trao đổi bằng các loại tiền tệ (vàng bạc), thì phạm tội Ưng Xả Đối Trị.`
},

{
    id: 'NP.20', title: 'Nissaggiya Pācittiya 20', audio: '4NP-20.mp3',
    text: `Yo pana bhikkhu nānappakārakaṃ kayavikkayaṃ samāpajjeyya, nissaggiyaṃ pācittiyaṃ. Kosiyavaggo dutiyo. [7.0]
Vị tỳ khưu nào thực hiện việc mua bán bằng nhiều hình thức khác nhau, thì phạm tội Ưng Xả Đối Trị. Chương về Tơ tằm là chương thứ hai.`
},

{
    id: 'NP.21', title: 'Nissaggiya Pācittiya 21', audio: '4NP-21.mp3',
    text: `Dasāhaparamaṃ atirekapatto dhāretabbo, taṃ atikkāmayato nissaggiyaṃ pācittiyaṃ. [6.0]
Bát dư có thể được cất giữ tối đa là mười ngày, nếu để quá thời hạn ấy thì phạm tội Ưng Xả Đối Trị.`
},

{
    id: 'NP.22', title: 'Nissaggiya Pācittiya 22', audio: '4NP-22.mp3',
    text: `Yo pana bhikkhu ūnapañcabandhanena pattena aññaṃ navaṃ pattaṃ cetāpeyya, nissaggiyaṃ pācittiyaṃ. [5.6]
Vị tỳ khưu nào có bát chưa hư hỏng quá năm chỗ hàn mà lại đổi một cái bát mới khác, thì phạm tội Ưng Xả Đối Trị.
Tena bhikkhunā so patto bhikkhuparisāya nissajjitabbo, yo ca tassā bhikkhuparisāya pattapariyanto, [5.7]
Vị tỳ khưu ấy phải xả bỏ cái bát đó giữa hội chúng tỳ khưu; và cái bát cuối cùng (xấu nhất) trong hội chúng đó,
so tassa bhikkhuno padātabbo “ayaṃ te bhikkhu patto yāva bhedanāya dhāretabbo”ti, ayaṃ tattha sāmīci. [6.6]
phải được trao lại cho vị tỳ khưu ấy với lời dặn: "Này tỳ khưu, cái bát này của ông, phải được sử dụng cho đến khi nó hư hỏng". Đây là phương cách đúng đắn trong trường hợp ấy.`
},

{
    id: 'NP.23', title: 'Nissaggiya Pācittiya 23', audio: '4NP-23.mp3',
    text: `Yāni kho pana tāni gilānānaṃ bhikkhūnaṃ paṭisāyanīyāni bhesajjāni, seyyathidaṃ – [5.8]
Lại nữa, những dược phẩm dành cho các tỳ khưu bệnh có thể dùng được, đó là:
sappi navanītaṃ telaṃ madhu phāṇitaṃ, tāni paṭiggahetvā sattāhaparamaṃ sannidhikārakaṃ paribhuñjitabbāni, [6.1]
bơ tươi, bơ lỏng, dầu, mật ong, đường phèn; sau khi thọ nhận, chúng có thể được cất giữ để sử dụng tối đa là bảy ngày.
taṃ atikkāmayato nissaggiyaṃ pācittiyaṃ. [3.0]
Nếu để quá thời hạn ấy, thì phạm tội Ưng Xả Đối Trị.`
},

{
    id: 'NP.24', title: 'Nissaggiya Pācittiya 24', audio: '4NP-24.mp3',
    text: `“Māso seso gimhānan”ti bhikkhunā vassikasāṭikacīvaraṃ pariyesitabbaṃ, [4.45]
"Còn một tháng nữa là hết mùa nóng", vị tỳ khưu nên tìm kiếm y tắm mưa,
“addhamāso seso gimhānan”ti katvā nivāsetabbaṃ. Orena ce “māso seso gimhānan”ti [5.2]
"Còn nửa tháng nữa là hết mùa nóng", nên làm thành y và mặc vào. Nếu tìm kiếm y tắm mưa khi còn hơn một tháng nữa mới hết mùa nóng,
vassikasāṭikacīvaraṃ pariyeseyya, orena“ddhamāso seso gimhānan”ti katvā nivāseyya, [4.9]
hoặc mặc y tắm mưa khi còn hơn nửa tháng nữa mới hết mùa nóng,
nissaggiyaṃ pācittiyaṃ. [2.6]
thì phạm tội Ưng Xả Đối Trị.`
},

{
    id: 'NP.25', title: 'Nissaggiya Pācittiya 25', audio: '4NP-25.mp3',
    text: `Yo pana bhikkhu bhikkhussa sāmaṃ cīvaraṃ datvā kupito anattamano acchindeyya vā acchindāpeyya vā, nissaggiyaṃ pācittiyaṃ. [7.5]
Vị tỳ khưu nào tự mình đã cho y đến một vị tỳ khưu khác, rồi sau đó vì giận hờn, không hài lòng mà tự mình đoạt lại hoặc bảo người khác đoạt lại, thì phạm tội Ưng Xả Đối Trị.`
},

{
    id: 'NP.26', title: 'Nissaggiya Pācittiya 26', audio: '4NP-26.mp3',
    text: `Yo pana bhikkhu sāmaṃ suttaṃ viññāpetvā tantavāyehi cīvaraṃ vāyāpeyya, nissaggiyaṃ pācittiyaṃ. [6.0]
Vị tỳ khưu nào tự mình xin sợi rồi mướn thợ dệt dệt thành y, thì phạm tội Ưng Xả Đối Trị.`
},

{
    id: 'NP.27', title: 'Nissaggiya Pācittiya 27', audio: '4NP-27.mp3',
    text: `Bhikkhuṃ paneva uddissa aññātako gahapati vā gahapatānī vā tantavāyehi cīvaraṃ vāyāpeyya, [5.5]
Lại nữa, có người nam gia chủ hoặc người nữ gia chủ không phải thân quyến mướn thợ dệt dệt y để dành riêng cho một vị tỳ khưu,
tatra ce so bhikkhu pubbe appavārito tantavāye upasaṅkamitvā cīvare vikappaṃ āpajjeyya [5.6]
nếu vị tỳ khưu ấy, khi chưa được mời trước, lại đến gặp thợ dệt và đưa ra các yêu cầu về y rằng:
“idaṃ kho, āvuso, cīvaraṃ maṃ uddissa viyyati, [2.9]
"Này đạo hữu, y này được dệt dành riêng cho tôi đó,
āyatañca karotha, vitthatañca, appitañca, suvītañca, suppavāyitañca, suvilekhitañca, suvitacchitañca karotha, [6.2]
hãy dệt cho dài, cho rộng, cho dày, cho khéo, cho đẹp, cho mịn, cho mướt nhé,
appeva nāma mayampi āyasmantānaṃ kiñcimattaṃ anupadajjeyyāmā”ti. [4.5]
biết đâu tôi cũng sẽ tặng cho các anh một chút vật gì đó".
Evañca so bhikkhu vatvā kiñcimattaṃ anupadajjeyya antamaso piṇḍapātamattampi, nissaggiyaṃ pācittiyaṃ. [6.7]
Nếu vị tỳ khưu nói như vậy rồi tặng cho họ một chút vật gì, dù chỉ là một bữa ăn, thì phạm tội Ưng Xả Đối Trị.`
},

{
    id: 'NP.28', title: 'Nissaggiya Pācittiya 28', audio: '4NP-28.mp3',
    text: `Dasāhānāgataṃ kattikatemāsikapuṇṇamaṃ bhikkhuno paneva accekacīvaraṃ uppajjeyya, [5.9]
Mười ngày trước rằm tháng mười hai (Kattika), nếu có "y đặc biệt" phát sinh đến cho vị tỳ khưu,
accekaṃ maññamānena bhikkhunā paṭiggahetabbaṃ, paṭiggahetvā yāva cīvarakālasamayaṃ nikkhipitabbaṃ. [5.7]
vị tỳ khưu biết đó là y đặc biệt thì hãy thọ nhận; sau khi thọ nhận rồi, có thể cất giữ cho đến hết mùa làm y.
Tato ce uttari nikkhipeyya, nissaggiyaṃ pācittiyaṃ. [3.5]
Nếu cất giữ quá thời hạn ấy, thì phạm tội Ưng Xả Đối Trị.`
},

{
    id: 'NP.29', title: 'Nissaggiya Pācittiya 29', audio: '4NP-29.mp3',
    text: `Upavassaṃ kho pana kattikapuṇṇamaṃ yāni kho pana tāni āraññakāni senāsanāni sāsaṅkasammatāni sappaṭibhayāni, [6.7]
Khi mùa (an cư) mưa đã qua ngày rằm tháng mười hai, có những trú xứ trong rừng được xem là nguy hiểm và đáng sợ,
tathārūpesu bhikkhu senāsanesu viharanto ākaṅkhamāno [3.8]
vị tỳ khưu đang sống ở những trú xứ như thế, nếu muốn,
tiṇṇaṃ cīvarānaṃ aññataraṃ cīvaraṃ antaraghare nikkhipeyya, [3.4]
có thể gởi một trong ba y ở tại nhà (trong làng),
siyā ca tassa bhikkhuno kocideva paccayo tena cīvarena vippavāsāya, [4.1]
và vị tỳ khưu ấy có thể có lý do nào đó để sống lìa khỏi y ấy,
chārattaparamaṃ tena bhikkhunā tena cīvarena vippavasitabbaṃ. [3.4]
vị tỳ khưu ấy có thể sống lìa y ấy tối đa là sáu đêm.
Tato ce uttariṃ vippavaseyya aññatra bhikkhusammutiyā, nissaggiyaṃ pācittiyaṃ. [4.9]
Nếu sống lìa quá thời hạn ấy, trừ khi được sự cho phép của Tăng chúng, thì phạm tội Ưng Xả Đối Trị.`
},

{
    id: 'NP.30', title: 'Nissaggiya Pācittiya 30', audio: '4NP-30.mp3',
    text: `Yo pana bhikkhu jānaṃ saṅghikaṃ lābhaṃ pariṇataṃ attano pariṇāmeyya, nissaggiyaṃ pācittiyaṃ. [5.2]
Vị tỳ khưu nào biết rõ vật dụng đã được dành để dâng đến Tăng chúng mà lại chuyển sang trao cho mình, thì phạm tội Ưng Xả Đối Trị.
Pattavaggo tatiyo. [2.5]
Chương về Bát là chương thứ ba.`
},

{
    id: 'NP.U', title: 'Nissaggiya Uddiṭṭhā', audio: '4NP-U.mp3',
    text: `Uddiṭṭhā kho āyasmanto tiṃsa nissaggiyā pācittiyā dhammā. Tatthāyasmante pucchāmi, kaccittha parisuddhā, [6.6]
Này các đại đức, ba mươi pháp Ưng Xả Đối Trị đã được tụng đọc xong. Trong phần này tôi xin hỏi các đại đức: Các đại đức có trong sạch không?
dutiyampi pucchāmi, kaccittha parisuddhā, tatiyampi pucchāmi, kaccittha parisuddhā, [4.0]
Tôi xin hỏi lần thứ nhì: Các đại đức có trong sạch không? Tôi xin hỏi lần thứ ba: Các đại đức có trong sạch không?
parisuddhetthāyasmanto, tasmā tuṇhī, evametaṃ dhārayāmīti. [4.3]
Các đại đức trong sạch, do đó mới im lặng. Tôi xin ghi nhận sự việc như vậy.
Nissaggiyapācittiyā niṭṭhitā [2.9]
Các pháp Ưng Xả Đối Trị đã kết thúc.`
},

{
    id: 'Pc.1-3', title: 'Pācittiya 1-3', audio: '5Pc-01-03.mp3',
    text: `Ime kho panāyasmanto dvenavuti pācittiyā Dhammā uddesaṃ āgacchanti. [4.8]
Này các đại đức, đây là chín mươi hai pháp Ưng Đối Trị được tụng đọc đến.
Sampajānamusāvāde pācittiyaṃ. Omasavāde pācittiyaṃ. Bhikkhupesuññe pācittiyaṃ. [5.5]
Cố ý nói dối, phạm tội Ưng Đối Trị. Nói lời khinh miệt, phạm tội Ưng Đối Trị. Nói lời đâm thọc giữa các tỳ khưu, phạm tội Ưng Đối Trị.`
},

{
    id: 'Pc.4', title: 'Pācittiya 4', audio: '5Pc-04.mp3',
    text: `Yo pana bhikkhu anupasampannaṃ padaso dhammaṃ vāceyya, pācittiyaṃ. [4.3]
Vị tỳ khưu nào dạy Pháp từng câu chữ cho người chưa thọ cụ túc giới, phạm tội Ưng Đối Trị.`
},

{
    id: 'Pc.5', title: 'Pācittiya 5', audio: '5Pc-05.mp3',
    text: `Yo pana bhikkhu anupasampannena uttariṃ dirattatirattaṃ sahaseyyaṃ kappeyya, pācittiyaṃ. [5.2]
Vị tỳ khưu nào nằm chung chỗ ngụ với người chưa thọ cụ túc giới quá hai hoặc ba đêm, phạm tội Ưng Đối Trị.`
},

{
    id: 'Pc.6', title: 'Pācittiya 6', audio: '5Pc-06.mp3',
    text: `Yo pana bhikkhu mātugāmena sahaseyyaṃ kappeyya, pācittiyaṃ. [4.0]
Vị tỳ khưu nào nằm chung chỗ ngụ với người nữ, phạm tội Ưng Đối Trị.`
},

{
    id: 'Pc.7', title: 'Pācittiya 7', audio: '5Pc-07.mp3',
    text: `Yo pana bhikkhu mātugāmassa uttariṃ chappañcavācāhi dhammaṃ deseyya aññatra viññunā purisaviggahena, pācittiyaṃ. [7.0]
Vị tỳ khưu nào thuyết pháp cho người nữ quá năm hoặc sáu lời, trừ khi có người nam hiểu biết đi cùng, phạm tội Ưng Đối Trị.`
},

{
    id: 'Pc.8', title: 'Pācittiya 8', audio: '5Pc-08.mp3',
    text: `Yo pana bhikkhu anupasampannassa uttarimanussadhammaṃ āroceyya, bhūtasmiṃ pācittiyaṃ. [5.5]
Vị tỳ khưu nào nói về pháp thượng nhân của mình cho người chưa thọ cụ túc giới, dù là có thật, phạm tội Ưng Đối Trị.`
},

{
    id: 'Pc.9', title: 'Pācittiya 9', audio: '5Pc-09.mp3',
    text: `Yo pana bhikkhu bhikkhussa duṭṭhullaṃ āpattiṃ anupasampannassa āroceyya aññatra bhikkhusammutiyā, pācittiyaṃ. [6.5]
Vị tỳ khưu nào nói về tội thô ác của một tỳ khưu cho người chưa thọ cụ túc giới, trừ khi được Tăng chúng cho phép, phạm tội Ưng Đối Trị.`
},

{
    id: 'Pc.10', title: 'Pācittiya 10', audio: '5Pc-10.mp3',
    text: `Yo pana bhikkhu pathaviṃ khaṇeyya vā khaṇāpeyya vā pācittiyaṃ. Musāvādavaggo paṭhamo. [5.8]
Vị tỳ khưu nào tự mình đào đất hoặc bảo người khác đào đất, phạm tội Ưng Đối Trị. Chương về Nói dối là chương thứ nhất.`
},

{
    id: 'Pc.11-13', title: 'Pācittiya 11-13', audio: '5Pc-11-13.mp3',
    text: `Bhūtagāmapātabyatāya pācittiyaṃ. Aññavādake vihesake pācittiyaṃ. Ujjhāpanake khiyyanake pācittiyaṃ. [6.8]
Phá hoại thảo mộc đang sinh trưởng, phạm tội Ưng Đối Trị. Nói lời quanh co làm phiền lòng người khác, phạm tội Ưng Đối Trị. Nói lời khinh chê, phiền trách (vị làm việc Tăng), phạm tội Ưng Đối Trị.`
},

{
    id: 'Pc.14', title: 'Pācittiya 14', audio: '5Pc-14.mp3',
    text: `Yo pana bhikkhu saṅghikaṃ mañcaṃ vā pīṭhaṃ vā bhisiṃ vā kocchaṃ vā ajjhokāse santharitvā vā santharāpetvā vā [6.7]
Vị tỳ khưu nào tự mình trải hoặc bảo người khác trải giường, ghế, nệm, hoặc ghế mây của Tăng chúng ngoài trời,
taṃ pakkamanto neva uddhareyya, na uddharāpeyya, anāpucchaṃ vā gaccheyya, pācittiyaṃ. [4.9]
khi rời khỏi nơi đó mà không tự mình dọn dẹp, không bảo người khác dọn dẹp, hoặc không bàn giao lại mà bỏ đi, phạm tội Ưng Đối Trị.`
},

{
    id: 'Pc.15', title: 'Pācittiya 15', audio: '5Pc-15.mp3',
    text: `Yo pana bhikkhu saṅghike vihāre seyyaṃ santharitvā vā santharāpetvā vā [4.6]
Vị tỳ khưu nào tự mình trải hoặc bảo người khác trải chỗ nghỉ trong trú xứ của Tăng chúng,
taṃ pakkamanto neva uddhareyya, na uddharāpeyya, anāpucchaṃ vā gaccheyya, pācittiyaṃ. [5.0]
khi rời khỏi nơi đó mà không tự mình dọn dẹp, không bảo người khác dọn dẹp, hoặc không bàn giao lại mà bỏ đi, phạm tội Ưng Đối Trị.`
},

{
    id: 'Pc.16', title: 'Pācittiya 16', audio: '5Pc-16.mp3',
    text: `Yo pana bhikkhu saṅghike vihāre jānaṃ pubbupagataṃ bhikkhuṃ anupakhajja seyyaṃ kappeyya [4.9]
Vị tỳ khưu nào biết rõ có vị tỳ khưu đã đến trước mà vẫn cố ý chen vào nằm nghỉ trong trú xứ của Tăng chúng (với ý nghĩ):
“yassa sambādho bhavissati, so pakkamissatī”ti [2.9]
"Vị nào thấy chật chội thì tự khắc sẽ rời đi",
etadeva paccayaṃ karitvā anaññaṃ, pācittiyaṃ. [3.6]
chỉ lấy lý do đó chứ không vì lý do nào khác, phạm tội Ưng Đối Trị.`
},

{
    id: 'Pc.17', title: 'Pācittiya 17', audio: '5Pc-17.mp3',
    text: `Yo pana bhikkhu bhikkhuṃ kupito anattamano saṅghikā vihārā nikkaḍḍheyya vā nikkaḍḍhāpeyya vā, pācittiyaṃ. [6.5]
Vị tỳ khưu nào vì tức giận, không hài lòng mà tự mình đuổi hoặc bảo người khác đuổi một vị tỳ khưu ra khỏi trú xứ của Tăng chúng, phạm tội Ưng Đối Trị.`
},

{
    id: 'Pc.18', title: 'Pācittiya 18', audio: '5Pc-18.mp3',
    text: `Yo pana bhikkhu saṅghike vihāre uparivehāsakuṭiyā āhaccapādakaṃ [4.2]
Vị tỳ khưu nào ở trong trú xứ của Tăng chúng, tại căn gác phía trên, ngồi hoặc nằm trên cái giường
mañcaṃ vā pīṭhaṃ vā abhinisīdeyya vā abhinipajjeyya vā, pācittiyaṃ. [4.5]
hoặc ghế có chân tháo rời được (đặt trực tiếp lên sàn), phạm tội Ưng Đối Trị.`
},

{
    id: 'Pc.19', title: 'Pācittiya 19', audio: '5Pc-19.mp3',
    text: `Mahallakaṃ pana bhikkhunā vihāraṃ kārayamānena yāva dvārakosā aggaḷaṭṭhapanāya [5.2]
Khi vị tỳ khưu cho xây dựng một tinh xá lớn, có thể lợp mái và tô trát xung quanh khung cửa để giữ cho vững chắc,
ālokasandhiparikammāya dvatticchadanassa pariyāyaṃ appaharite ṭhitena adhiṭṭhātabbaṃ, [5.1]
cũng như chuẩn bị các ô cửa sổ, tối đa là hai hoặc ba lớp ở những nơi không có cây trồng;
tato ce uttariṃ appaharitepi ṭhito adhiṭṭhaheyya, pācittiyaṃ. [4.0]
nếu xây dựng quá mức ấy, dù đứng ở nơi không có cây trồng mà giám sát, vẫn phạm tội Ưng Đối Trị.`
},

{
    id: 'Pc.20', title: 'Pācittiya 20', audio: '5Pc-20.mp3',
    text: `Yo pana bhikkhu jānaṃ sappāṇakaṃ udakaṃ tiṇaṃ vā mattikaṃ vā siñceyya vā siñcāpeyya vā, pācittiyaṃ. [5.8]
Vị tỳ khưu nào biết nước có côn trùng mà vẫn tự mình tưới hoặc bảo người khác tưới lên cỏ hoặc đất, phạm tội Ưng Đối Trị.
Bhūtagāmavaggo dutiyo. [2.5]
Chương về Thảo mộc là chương thứ hai.`
},

{
    id: 'Pc.21', title: 'Pācittiya 21', audio: '5Pc-21.mp3',
    text: `Yo pana bhikkhu asammato bhikkhuniyo ovadeyya, pācittiyaṃ. [4.5]
Vị tỳ khưu nào chưa được (Tăng) chỉ định mà đi giáo giới các tỳ khưu ni, phạm tội Ưng Đối Trị.`
},

{
    id: 'Pc.22', title: 'Pācittiya 22', audio: '5Pc-22.mp3',
    text: `Sammatopi ce bhikkhu atthaṅgate sūriye bhikkhuniyo ovadeyya, pācittiyaṃ. [4.7]
Dù đã được chỉ định, nếu vị tỳ khưu giáo giới các tỳ khưu ni khi mặt trời đã lặn, phạm tội Ưng Đối Trị.`
},

{
    id: 'Pc.23', title: 'Pācittiya 23', audio: '5Pc-23.mp3',
    text: `Yo pana bhikkhu bhikkhūnupassayaṃ upasaṅkamitvā bhikkhuniyo ovadeyya [3.8]
Vị tỳ khưu nào đi đến trú xá của các tỳ khưu ni để giáo giới,
aññatra samayā, pācittiyaṃ. Tatthāyaṃ samayo, gilānā hoti bhikkhunī, ayaṃ tattha samayo. [5.5]
trừ khi vào lúc thích hợp, phạm tội Ưng Đối Trị. Lúc thích hợp ở đây là khi tỳ khưu ni bị bệnh.`
},

{
    id: 'Pc.24', title: 'Pācittiya 24', audio: '5Pc-24.mp3',
    text: `Yo pana bhikkhu evaṃ vadeyya “āmisahetu bhikkhū bhikkhuniyo ovadantī”ti, pācittiyaṃ. [5.5]
Vị tỳ khưu nào nói như vầy: "Các tỳ khưu giáo giới các tỳ khưu ni chỉ vì lợi dưỡng", phạm tội Ưng Đối Trị.`
},

{
    id: 'Pc.25', title: 'Pācittiya 25', audio: '5Pc-25.mp3',
    text: `Yo pana bhikkhu aññātikāya bhikkhuniyā cīvaraṃ dadeyya aññatra pārivattakā, pācittiyaṃ. [5.7]
Vị tỳ khưu nào cho y đến tỳ khưu ni không phải thân quyến, trừ khi có sự trao đổi y, phạm tội Ưng Đối Trị.`
},

{
    id: 'Pc.26', title: 'Pācittiya 26', audio: '5Pc-26.mp3',
    text: `Yo pana bhikkhu aññātikāya bhikkhuniyā cīvaraṃ sibbeyya vā sibbāpeyya vā, pācittiyaṃ. [5.7]
Vị tỳ khưu nào tự mình may hoặc bảo người khác may y cho tỳ khưu ni không phải thân quyến, phạm tội Ưng Đối Trị.`
},

{
    id: 'Pc.27', title: 'Pācittiya 27', audio: '5Pc-27.mp3',
    text: `Yo pana bhikkhu bhikkhuniyā saddhiṃ saṃvidhāya ekaddhānamaggaṃ paṭipajjeyya [4.4]
Vị tỳ khưu nào hẹn trước với tỳ khưu ni rồi cùng đi chung một con đường,
antamaso gāmantarampi aññatra samayā, pācittiyaṃ. [3.3]
dù chỉ là từ làng này sang làng khác, trừ khi vào lúc thích hợp, phạm tội Ưng Đối Trị.
Tatthāyaṃ samayo, satthagamanīyo hoti maggo, sāsaṅkasammato, sappaṭibhayo, [4.7]
Lúc thích hợp ở đây là: con đường phải đi theo đoàn lữ hành, được xem là nguy hiểm và đáng sợ;
ayaṃ tattha samayo. [2.3]
đó là lúc thích hợp trong trường hợp này.`
},

{
    id: 'Pc.28', title: 'Pācittiya 28', audio: '5Pc-28.mp3',
    text: `Yo pana bhikkhu bhikkhuniyā saddhiṃ saṃvidhāya ekaṃ nāvaṃ abhirūheyya [4.4]
Vị tỳ khưu nào hẹn trước với tỳ khưu ni rồi cùng đi chung một chiếc thuyền,
uddhaṃgāminiṃ vā adhogāminiṃ vā aññatra tiriyaṃ taraṇāya, pācittiyaṃ. [4.8]
đi ngược dòng hay xuôi dòng, ngoại trừ khi đi ngang qua sông, phạm tội Ưng Đối Trị.`
},

{
    id: 'Pc.29', title: 'Pācittiya 29', audio: '5Pc-29.mp3',
    text: `Yo pana bhikkhu jānaṃ bhikkhuniparipācitaṃ piṇḍapātaṃ bhuñjeyya aññatra pubbe gihīsamārambhā, pācittiyaṃ. [7.1]
Vị tỳ khưu nào biết rõ vật thực do tỳ khưu ni sắp đặt (xúi giục gia chủ làm) mà vẫn thọ thực, trừ khi vật thực ấy đã được các gia chủ chuẩn bị từ trước, phạm tội Ưng Đối Trị.`
},

{
    id: 'Pc.30', title: 'Pācittiya 30', audio: '5Pc-30.mp3',
    text: `Yo pana bhikkhu bhikkhuniyā saddhiṃ eko ekāya raho nisajjaṃ kappeyya, pācittiyaṃ. [5.0]
Vị tỳ khưu nào cùng với tỳ khưu ni ngồi ở nơi khuất tầm mắt, chỉ có hai người, phạm tội Ưng Đối Trị.
Bhikkhunovādavaggo tatiyo [2.5]
Chương về Giáo giới Tỳ-khưu-ni là chương thứ ba.`
},

{
    id: 'Pc.31', title: 'Pācittiya 31', audio: '5Pc-31.mp3',
    text: `Agilānena bhikkhunā eko āvasathapiṇḍo bhuñjitabbo. Tato ce uttariṃ bhuñjeyya, pācittiyaṃ. [6.0]
Một vị tỳ khưu không bị bệnh chỉ nên ăn một bữa tại phước xá (nơi dâng thực phẩm công cộng). Nếu ăn quá mức đó, phạm tội Ưng Đối Trị.`
},

{
    id: 'Pc.32', title: 'Pācittiya 32', audio: '5Pc-32.mp3',
    text: `Gaṇabhojane aññatra samayā pācittiyaṃ. Tatthāyaṃ samayo, gilānasamayo, cīvaradānasamayo, [5.1]
Dùng bữa theo nhóm (được mời đích danh), trừ khi vào lúc thích hợp, phạm tội Ưng Đối Trị. Lúc thích hợp ở đây là: lúc bị bệnh, lúc dâng y,
cīvarakārasamayo, addhānagamanasamayo, nāvahirūhanasamayo, mahāsamayo, samaṇabhattasamayo, ayaṃ tattha samayo. [6.6]
lúc làm y, lúc đi đường xa, lúc đi thuyền, lúc đông đảo tỳ khưu, lúc có bữa ăn dành cho sa-môn; đó là lúc thích hợp trong trường hợp này.`
},

{
    id: 'Pc.33', title: 'Pācittiya 33', audio: '5Pc-33.mp3',
    text: `Paramparabhojane aññatra samayā pācittiyaṃ. [3.0]
Dùng bữa liên tiếp (nhận lời mời nơi này rồi sang nơi khác), trừ khi vào lúc thích hợp, phạm tội Ưng Đối Trị.
Tatthāyaṃ samayo, gilānasamayo, cīvaradānasamayo, cīvarakārasamayo, ayaṃ tattha samayo. [5.2]
Lúc thích hợp ở đây là: lúc bị bệnh, lúc dâng y, lúc làm y; đó là lúc thích hợp trong trường hợp này.`
},

{
    id: 'Pc.34', title: 'Pācittiya 34', audio: '5Pc-34.mp3',
    text: `Bhikkhuṃ paneva kulaṃ upagataṃ pūvehi vā manthehi vā abhihaṭṭhuṃ pavāreyya, [4.8]
Nếu vị tỳ khưu đi đến một gia đình và được họ dâng cúng nhiều bánh hoặc bột ngũ cốc,
ākaṅkhamānena bhikkhunā dvattipattapūrā paṭiggahetabbā. Tato ce uttariṃ paṭiggaṇheyya, pācittiyaṃ. [5.8]
vị tỳ khưu nếu muốn chỉ nên thọ nhận đầy hai hoặc ba bát. Nếu thọ nhận quá mức đó, phạm tội Ưng Đối Trị.
Dvattipattapūre paṭiggahetvā tato nīharitvā bhikkhūhi saddhiṃ saṃvibhajitabbaṃ, ayaṃ tattha sāmīci. [6.2]
Sau khi nhận đầy hai hoặc ba bát, mang về phải chia sẻ cùng các vị tỳ khưu khác; đó là phương cách đúng đắn trong trường hợp này.`
},

{
    id: 'Pc.35', title: 'Pācittiya 35', audio: '5Pc-35.mp3',
    text: `Yo pana bhikkhu bhuttāvī pavārito anatirittaṃ khādanīyaṃ vā bhojanīyaṃ vā khādeyya vā bhuñjeyya vā, pācittiyaṃ. [7.0]
Vị tỳ khưu nào đã ăn xong, đã từ chối (không nhận thêm thực phẩm) mà lại dùng thêm các loại thức ăn cứng hoặc thức ăn mềm không phải là thức ăn dư của người bệnh, phạm tội Ưng Đối Trị.`
},

{
    id: 'Pc.36', title: 'Pācittiya 36', audio: '5Pc-36.mp3',
    text: `Yo pana bhikkhu bhikkhuṃ bhuttāviṃ pavāritaṃ anatirittena khādanīyena vā bhojanīyena vā abhihaṭṭhuṃ pavāreyya [6.1]
Vị tỳ khưu nào biết một vị tỳ khưu khác đã ăn xong, đã từ chối mà lại cố ý đem thức ăn cứng hoặc thức ăn mềm không phải là đồ dư của người bệnh đến mời (với ý nghĩ):
“handa bhikkhu khāda vā bhuñja vā”ti jānaṃ āsādanāpekkho, bhuttasmiṃ pācittiyaṃ. [5.2]
"Này tỳ khưu, hãy ăn đi", nhằm mục đích làm cho vị ấy phạm tội; nếu vị kia ăn, thì vị mời phạm tội Ưng Đối Trị.`
},

{
    id: 'Pc.37', title: 'Pācittiya 37', audio: '5Pc-37.mp3',
    text: `Yo pana bhikkhu vikāle khādanīyaṃ vā bhojanīyaṃ vā khādeyya vā bhuñjeyya vā, pācittiyaṃ. [5.7]
Vị tỳ khưu nào dùng thức ăn cứng hoặc thức ăn mềm vào phi thời (từ quá ngọ đến trước khi rạng đông), phạm tội Ưng Đối Trị.`
},

{
    id: 'Pc.38', title: 'Pācittiya 38', audio: '5Pc-38.mp3',
    text: `Yo pana bhikkhu sannidhikārakaṃ khādanīyaṃ vā bhojanīyaṃ vā khādeyya vā bhuñjeyya vā, pācittiyaṃ. [5.9]
Vị tỳ khưu nào dùng thức ăn cứng hoặc thức ăn mềm đã được cất giữ qua đêm, phạm tội Ưng Đối Trị.`
},

{
    id: 'Pc.39', title: 'Pācittiya 39', audio: '5Pc-39.mp3',
    text: `Yāni kho pana tāni paṇītabhojanāni, seyyathīdaṃ – sappi, navanītaṃ, telaṃ, madhu, phāṇitaṃ, maccho, maṃsaṃ, khīraṃ, dadhi. [6.55]
Có những loại thức ăn hảo hạng, đó là: bơ tươi, bơ lỏng, dầu, mật ong, đường phèn, cá, thịt, sữa, sữa chua.
Yo pana bhikkhu evarūpāni paṇītabhojanāni agilāno attano atthāya viññāpetvā bhuñjeyya, pācittiyaṃ. [6.3]
Vị tỳ khưu nào không bị bệnh mà lại xin các loại thức ăn hảo hạng như thế cho riêng mình rồi dùng, phạm tội Ưng Đối Trị.`
},

{
    id: 'Pc.40', title: 'Pācittiya 40', audio: '5Pc-40.mp3',
    text: `Yo pana bhikkhu adinnaṃ mukhadvāraṃ āhāraṃ āhareyya aññatra udakadantapoṇā, pācittiyaṃ. Bhojanavaggo catuttho. [7.5]
Vị tỳ khưu nào đưa vào miệng vật thực chưa được dâng cúng, ngoại trừ nước lọc và tăm xỉa răng, phạm tội Ưng Đối Trị. Chương về Vật thực là chương thứ tư.`
},

{
    id: 'Pc.41', title: 'Pācittiya 41', audio: '5Pc-41.mp3',
    text: `Yo pana bhikkhu acelakassa vā paribbājakassa vā paribbājikāya vā sahatthā khādanīyaṃ vā bhojanīyaṃ vā dadeyya, pācittiyaṃ. [7.6]
Vị tỳ khưu nào tự tay cho thức ăn cứng hoặc thức ăn mềm đến du sĩ ngoại đạo khỏa thân, hoặc nam du sĩ, hoặc nữ du sĩ ngoại đạo, phạm tội Ưng Đối Trị.`
},

{
    id: 'Pc.42', title: 'Pācittiya 42', audio: '5Pc-42.mp3',
    text: `Yo pana bhikkhu bhikkhuṃ “ehāvuso, gāmaṃ vā nigamaṃ vā piṇḍāya pavisissāmā”ti [4.7]
Vị tỳ khưu nào nói với vị tỳ khưu khác rằng: "Này đạo hữu, hãy đến đây, chúng ta sẽ vào làng hoặc thị trấn để khất thực",
tassa dāpetvā vā adāpetvā vā uyyojeyya [3.0]
sau khi đã bảo người ta dâng thực phẩm hoặc chưa bảo dâng, lại đuổi vị ấy đi rằng:
“gacchāvuso, na me tayā saddhiṃ kathā vā nisajjā vā phāsu hoti, [4.1]
"Đạo hữu hãy đi đi, tôi cùng với đạo hữu nói chuyện hoặc ngồi chung không được thoải mái,
ekakassa me kathā vā nisajjā vā phāsu hotī”ti [3.5]
tôi nói chuyện hoặc ngồi một mình mới thấy thoải mái hơn",
etadeva paccayaṃ karitvā anaññaṃ, pācittiyaṃ. [3.6]
chỉ lấy lý do đó chứ không vì lý do nào khác, phạm tội Ưng Đối Trị.`
},

{
    id: 'Pc.43', title: 'Pācittiya 43', audio: '5Pc-43.mp3',
    text: `Yo pana bhikkhu sabhojane kule anupakhajja nisajjaṃ kappeyya, pācittiyaṃ. [4.8]
Vị tỳ khưu nào đến gia đình đang dùng bữa (mà đôi nam nữ đang ở riêng với nhau) rồi cố ý xen vào ngồi đó, phạm tội Ưng Đối Trị.`
},

{
    id: 'Pc.44', title: 'Pācittiya 44', audio: '5Pc-44.mp3',
    text: `Yo pana bhikkhu mātugāmena saddhiṃ raho paṭicchanne āsane nisajjaṃ kappeyya, pācittiyaṃ. [5.5]
Vị tỳ khưu nào cùng với người nữ ngồi ở nơi khuất tầm mắt, trên chỗ ngồi kín đáo, phạm tội Ưng Đối Trị.`
},

{
    id: 'Pc.45', title: 'Pācittiya 45', audio: '5Pc-45.mp3',
    text: `Yo pana bhikkhu mātugāmena saddhiṃ eko ekāya raho nisajjaṃ kappeyya, pācittiyaṃ. [5.3]
Vị tỳ khưu nào cùng với người nữ ngồi ở nơi trống trải nhưng khuất tầm mắt, chỉ có hai người, phạm tội Ưng Đối Trị.`
},

{
    id: 'Pc.46', title: 'Pācittiya 46', audio: '5Pc-46.mp3',
    text: `Yo pana bhikkhu nimantito sabhatto samāno santaṃ bhikkhuṃ anāpucchā purebhattaṃ vā pacchābhattaṃ vā [5.9]
Vị tỳ khưu đã được mời thọ thực, trong khi vẫn còn vị tỳ khưu khác ở đó, mà không xin phép vị ấy mà đi đến các gia đình khác vào trước bữa ăn hoặc sau bữa ăn,
kulesu cārittaṃ āpajjeyya aññatra samayā, pācittiyaṃ. [3.4]
trừ khi vào lúc thích hợp, phạm tội Ưng Đối Trị.
Tatthāyaṃ samayo, cīvaradānasamayo, cīvarakārasamayo, ayaṃ tattha samayo. [4.8]
Lúc thích hợp ở đây là: lúc dâng y, lúc làm y; đó là lúc thích hợp trong trường hợp này.`
},

{
    id: 'Pc.47', title: 'Pācittiya 47', audio: '5Pc-47.mp3',
    text: `Agilānena bhikkhunā cātumāsappaccayapavāraṇā sāditabbā [3.8]
Vị tỳ khưu không bị bệnh chỉ nên thọ nhận sự cung thỉnh về vật dụng tối đa trong bốn tháng;
aññatra punapavāraṇāya, aññatra niccapavāraṇāya. Tato ce uttariṃ sādiyeyya, pācittiyaṃ. [5.5]
trừ khi có sự cung thỉnh lại, hoặc cung thỉnh mãi mãi. Nếu thọ nhận quá mức đó, phạm tội Ưng Đối Trị.`
},

{
    id: 'Pc.48', title: 'Pācittiya 48', audio: '5Pc-48.mp3',
    text: `Yo pana bhikkhu uyyuttaṃ senaṃ dassanāya gaccheyya aññatra tathārūpappaccayā, pācittiyaṃ. [5.5]
Vị tỳ khưu nào đi xem quân đội đang xuất quân, trừ khi có lý do chính đáng, phạm tội Ưng Đối Trị.`
},

{
    id: 'Pc.49', title: 'Pācittiya 49', audio: '5Pc-49.mp3',
    text: `Siyā ca tassa bhikkhuno kocideva paccayo senaṃ gamanāya, dirattatirattaṃ tena bhikkhunā senāya vasitabbaṃ. [5.8]
Nếu vị tỳ khưu có lý do nào đó phải đi đến quân đội, vị ấy có thể ở lại trong quân đội hai hoặc ba đêm.
Tato ce uttariṃ vaseyya, pācittiyaṃ. [3.0]
Nếu ở lại quá thời hạn ấy, phạm tội Ưng Đối Trị.`
},

{
    id: 'Pc.50', title: 'Pācittiya 50', audio: '5Pc-50.mp3',
    text: `Dirattatirattaṃ ce bhikkhu senāya vasamāno uyyodhikaṃ vā balaggaṃ vā senābyūhaṃ vā anīkadassanaṃ vā gaccheyya, pācittiyaṃ. [7.3]
Trong khi ở lại quân đội hai hoặc ba đêm, nếu vị tỳ khưu đi xem diễn tập chiến đấu, hoặc xem dàn trận, hoặc xem duyệt binh, phạm tội Ưng Đối Trị.
Acelakavaggo pañcamo. [2.5]
Chương về Du sĩ Khỏa thân là chương thứ năm.`
},

{
    id: 'Pc.51-54', title: 'Pācittiya 51-54', audio: '5Pc-51-54.mp3',
    text: `Surāmerayapāne pācittiyaṃ. Aṅgulipatodake pācittiyaṃ. Udake hassadhamme pācittiyaṃ. Anādariye pācittiyaṃ. [7.0]
Uống rượu và các chất say, phạm tội Ưng Đối Trị. Dùng ngón tay thọc léc nhau, phạm tội Ưng Đối Trị. Nghịch ngợm dưới nước, phạm tội Ưng Đối Trị. Có thái độ vô lễ (đối với lời khuyên bảo), phạm tội Ưng Đối Trị.`
},

{
    id: 'Pc.55-56', title: 'Pācittiya 55-56', audio: '5Pc-55-56.mp3',
    text: `Yo pana bhikkhu bhikkhuṃ bhiṃsāpeyya, pācittiyaṃ. Yo pana bhikkhu agilāno visibbanāpekkho jotiṃ samādaheyya vā [6.4]
Vị tỳ khưu nào nhát ma (làm kinh sợ) vị tỳ khưu khác, phạm tội Ưng Đối Trị. Vị tỳ khưu nào không bị bệnh mà lại tự mình đốt lửa để sưởi,
samādahāpeyya vā aññatra tathārūpappaccayā, pācittiyaṃ. [4.1]
hoặc bảo người khác đốt lửa, trừ khi có lý do chính đáng, phạm tội Ưng Đối Trị.`
},

{
    id: 'Pc.57', title: 'Pācittiya 57', audio: '5Pc-57.mp3',
    text: `Yo pana bhikkhu orenaddhamāsaṃ nahāyeyya aññatra samayā, pācittiyaṃ. Tatthāyaṃ samayo [4.8]
Vị tỳ khưu nào tắm trong vòng chưa đầy nửa tháng, trừ khi vào lúc thích hợp, phạm tội Ưng Đối Trị. Lúc thích hợp ở đây là:
“diyaḍḍho māso seso gimhāna”nti “vassānassa paṭhamo māso” [3.7]
"Còn một tháng rưỡi nữa là hết mùa nóng" và "tháng đầu tiên của mùa mưa",
iccete aḍḍhateyyamāsā uṇhasamayo, pariḷāhasamayo, gilānasamayo, kammasamayo, addhānagamanasamayo, [5.8]
trong hai tháng rưỡi này là lúc trời nóng, lúc mệt mỏi, lúc bị bệnh, lúc đang làm việc, lúc đi đường xa,
vātavuṭṭhisamayo, ayaṃ tattha samayo. [3.0]
lúc trời gió mưa; đó là lúc thích hợp trong trường hợp này.`
},

{
    id: 'Pc.58', title: 'Pācittiya 58', audio: '5Pc-58.mp3',
    text: `Navaṃ pana bhikkhunā cīvaralābhena tiṇṇaṃ dubbaṇṇakaraṇānaṃ aññataraṃ dubbaṇṇakaraṇaṃ ādātabbaṃ [5.6]
Vị tỳ khưu khi nhận được y mới, phải làm cho nó mất màu bằng một trong ba cách nhuộm:
nīlaṃ vā kaddamaṃ vā kāḷasāmaṃ vā. Anādā ce bhikkhu tiṇṇaṃ dubbaṇṇakaraṇānaṃ aññataraṃ dubbaṇṇakaraṇaṃ [6.1]
bằng màu chàm, hoặc màu bùn, hoặc màu nâu sẫm. Nếu không làm cho y mới mất màu bằng một trong ba cách đó
navaṃ cīvaraṃ paribhuñjeyya, pācittiyaṃ. [3.0]
mà đã sử dụng, phạm tội Ưng Đối Trị.`
},

{
    id: 'Pc.59', title: 'Pācittiya 59', audio: '5Pc-59.mp3',
    text: `Yo pana bhikkhu bhikkhussa vā bhikkhuniyā vā sikkhamānāya vā sāmaṇerassa vā sāmaṇeriyā vā sāmaṃ cīvaraṃ vikappetvā [6.8]
Vị tỳ khưu nào sau khi đã làm phép gởi y (vikappa) đến tỳ khưu, hoặc tỳ khưu ni, hoặc tập sự nữ, hoặc sa di, hoặc sa di ni,
apaccuddhārakaṃ paribhuñjeyya, pācittiyaṃ. [3.0]
mà lại sử dụng khi chưa được vị kia trả lại, phạm tội Ưng Đối Trị.`
},

{
    id: 'Pc.60', title: 'Pācittiya 60', audio: '5Pc-60.mp3',
    text: `Yo pana bhikkhu bhikkhussa pattaṃ vā cīvaraṃ vā nisīdanaṃ vā sūcigharaṃ vā kāyabandhanaṃ vā apanidheyya vā [5.6]
Vị tỳ khưu nào tự mình cất giấu hoặc bảo người khác cất giấu bát, hoặc y, hoặc tọa cụ, hoặc ống kim, hoặc dây thắt lưng của một vị tỳ khưu khác,
apanidhāpeyya vā antamaso hassāpekkhopi, pācittiyaṃ. Surāpānavaggo chaṭṭho. [5.5]
dù chỉ là để đùa giỡn, phạm tội Ưng Đối Trị. Chương về Uống rượu là chương thứ sáu.`
},

{
    id: 'Pc.61-62', title: 'Pācittiya 61-62', audio: '5Pc-61-62.mp3',
    text: `Yo pana bhikkhu sañcicca pāṇaṃ jīvitā voropeyya, pācittiyaṃ. Yo pana bhikkhu jānaṃ sappāṇakaṃ udakaṃ paribhuñjeyya, pācittiyaṃ. [7.5]
Vị tỳ khưu nào cố ý sát hại chúng sinh, phạm tội Ưng Đối Trị. Vị tỳ khưu nào biết nước có côn trùng mà vẫn sử dụng, phạm tội Ưng Đối Trị.`
},

{
    id: 'Pc.63', title: 'Pācittiya 63', audio: '5Pc-63.mp3',
    text: `Yo pana bhikkhu jānaṃ yathādhammaṃ nihatādhikaraṇaṃ punakammāya ukkoṭeyya, pācittiyaṃ. [5.5]
Vị tỳ khưu nào biết một vụ việc đã được giải quyết đúng pháp mà lại khơi dậy để xem xét lại, phạm tội Ưng Đối Trị.`
},

{
    id: 'Pc.64', title: 'Pācittiya 64', audio: '5Pc-64.mp3',
    text: `Yo pana bhikkhu bhikkhussa jānaṃ duṭṭhullaṃ āpattiṃ paṭicchādeyya, pācittiyaṃ. [5.0]
Vị tỳ khưu nào biết rõ tội thô ác của một vị tỳ khưu khác mà vẫn che giấu, phạm tội Ưng Đối Trị.`
},

{
    id: 'Pc.65', title: 'Pācittiya 65', audio: '5Pc-65.mp3',
    text: `Yo pana bhikkhu jānaṃ ūnavīsativassaṃ puggalaṃ upasampādeyya, [4.0]
Vị tỳ khưu nào biết rõ một người chưa đủ hai mươi tuổi mà vẫn cho thọ cụ túc giới,
so ca puggalo anupasampanno, te ca bhikkhū gārayhā, [3.2]
người ấy vẫn chưa thành tỳ khưu, và các vị tỳ khưu (làm lễ) ấy đáng bị khiển trách;
idaṃ tasmiṃ pācittiyaṃ. [2.3]
đây là tội Ưng Đối Trị trong việc đó.`
},

{
    id: 'Pc.66', title: 'Pācittiya 66', audio: '5Pc-66.mp3',
    text: `Yo pana bhikkhu jānaṃ theyyasatthena saddhiṃ saṃvidhāya ekaddhānamaggaṃ paṭipajjeyya [5.0]
Vị tỳ khưu nào biết rõ mà vẫn hẹn trước rồi cùng đi chung một con đường với đoàn lữ hành trộm cướp,
antamaso gāmantarampi, pācittiyaṃ. [3.0]
dù chỉ là từ làng này sang làng khác, phạm tội Ưng Đối Trị.`
},

{
    id: 'Pc.67', title: 'Pācittiya 67', audio: '5Pc-67.mp3',
    text: `Yo pana bhikkhu mātugāmena saddhiṃ saṃvidhāya ekaddhānamaggaṃ paṭipajjeyya [4.5]
Vị tỳ khưu nào hẹn trước với người nữ rồi cùng đi chung một con đường,
antamaso gāmantarampi, pācittiyaṃ. [2.8]
dù chỉ là từ làng này sang làng khác, phạm tội Ưng Đối Trị.`
},

{
    id: 'Pc.68', title: 'Pācittiya 68', audio: '5Pc-68.mp3',
    text: `Yo pana bhikkhu evaṃ vadeyya “tathāhaṃ bhagavatā dhammaṃ desitaṃ ājānāmi, [4.7]
Vị tỳ khưu nào nói như vầy: "Theo như tôi hiểu về Pháp do Đức Thế Tôn thuyết giảng,
yathā yeme antarāyikā dhammā vuttā bhagavatā, [3.3]
thì những pháp được Đức Thế Tôn gọi là chướng ngại,
te paṭisevato nālaṃ antarāyāyā”ti, [2.9]
khi thực hành chúng cũng không thực sự gây ra chướng ngại đâu",
so bhikkhu bhikkhūhi evamassa vacanīyo [2.4]
vị tỳ khưu ấy cần được các vị tỳ khưu khác nhắc nhở rằng:
“mā āyasmā evaṃ avaca, mā bhagavantaṃ abbhācikkhi, [3.4]
"Này đạo hữu, đừng nói như vậy, đừng xuyên tạc lời Đức Thế Tôn,
na hi sādhu bhagavato abbhakkhānaṃ, na hi bhagavā evaṃ vadeyya, [3.8]
xuyên tạc lời Đức Thế Tôn là không tốt, Ngài không hề nói như vậy.
anekapariyāyena āvuso antarāyikā dhammā antarāyikā vuttā bhagavatā, [4.7]
Này đạo hữu, bằng nhiều cách khác nhau, Đức Thế Tôn đã khẳng định các pháp chướng ngại thực sự là chướng ngại,
alañca pana te paṭisevato antarāyāyā”ti. [3.1]
và chúng chắc chắn gây ra trở ngại cho người thực hành chúng".
Evañca so bhikkhu bhikkhūhi vuccamāno tatheva paggaṇheyya, [3.7]
Nếu vị tỳ khưu ấy khi được nhắc nhở như vậy vẫn khăng khăng không đổi,
so bhikkhu bhikkhūhi yāvatatiyaṃ samanubhāsitabbo tassa paṭinissaggāya. [4.1]
thì các vị tỳ khưu nên khuyên bảo vị ấy đến lần thứ ba để vị ấy từ bỏ tà kiến đó.
Yāvatatiyañce samanubhāsiyamāno taṃ paṭinissajjeyya, iccetaṃ kusalaṃ. [4.2]
Nếu sau lần khuyên bảo thứ ba mà vị ấy từ bỏ, thời như vậy là tốt đẹp.
No ce paṭinissajjeyya, pācittiyaṃ. [3.3]
Nếu không từ bỏ, phạm tội Ưng Đối Trị.`
},

{
    id: 'Pc.69', title: 'Pācittiya 69', audio: '5Pc-69.mp3',
    text: `Yo pana bhikkhu jānaṃ tathāvādinā bhikkhunā akaṭānudhammena taṃ diṭṭhiṃ appaṭinissaṭṭhena saddhiṃ sambhuñjeyya vā, saṃvaseyya vā, saha vā seyyaṃ kappeyya, pācittiyaṃ. [10.0]
Vị tỳ khưu nào biết rõ một vị tỳ khưu có quan điểm như vậy, chưa được xử lý đúng pháp, chưa từ bỏ tà kiến đó, mà vẫn cùng ăn chung, hoặc cùng sinh hoạt chung, hoặc cùng nằm nghỉ chung, phạm tội Ưng Đối Trị.`
},

{
    id: 'Pc.70', title: 'Pācittiya 70', audio: '5Pc-70.mp3',
    text: `Samaṇuddesopi ce evaṃ vadeyya “tathāhaṃ bhagavatā dhammaṃ desitaṃ ājānāmi, [5.2]
Nếu có sa di nào nói như vầy: "Theo như tôi hiểu về Pháp do Đức Thế Tôn thuyết giảng,
yathā yeme antarāyikā dhammā vuttā bhagavatā, [3.35]
thì những pháp được Đức Thế Tôn gọi là chướng ngại,
te paṭisevato nālaṃ antarāyāyā”ti, [3.1]
khi thực hành chúng cũng không thực sự gây ra chướng ngại đâu",
so samaṇuddeso bhikkhūhi evamassa vacanīyo [2.9]
vị sa di ấy cần được các vị tỳ khưu nhắc nhở rằng:
“mā āvuso, samaṇuddesa evaṃ avaca, [2.8]
"Này đạo hữu sa di, đừng nói như vậy,
mā bhagavantaṃ abbhācikkhi, [2.1]
đừng xuyên tạc lời Đức Thế Tôn,
na hi sādhu bhagavato abbhakkhānaṃ, na hi bhagavā evaṃ vadeyya, [4.2]
xuyên tạc lời Đức Thế Tôn là không tốt, Ngài không hề nói như vậy.
anekapariyāyena āvuso, samaṇuddesa antarāyikā dhammā antarāyikā vuttā bhagavatā, [5.2]
Này đạo hữu sa di, bằng nhiều cách khác nhau, Đức Thế Tôn đã khẳng định các pháp chướng ngại thực sự là chướng ngại,
alañca pana te paṭisevato antarāyāyā”ti, [3.3]
và chúng chắc chắn gây ra trở ngại cho người thực hành chúng",
evañca so samaṇuddeso bhikkhūhi vuccamāno tatheva paggaṇheyya, [4.2]
nếu vị sa di ấy khi được các vị tỳ khưu nhắc nhở như vậy vẫn khăng khăng không đổi,
so samaṇuddeso bhikkhūhi evamassa vacanīyo [2.8]
thì các vị tỳ khưu nên bảo vị sa di ấy rằng:
“ajjatagge te, āvuso, samaṇuddesa na ceva so bhagavā satthā apadisitabbo, [4.5]
"Này đạo hữu sa di, kể từ hôm nay, đạo hữu không được xem Đức Thế Tôn là thầy nữa,
yampi caññe samaṇuddesā labhanti bhikkhūhi saddhiṃ dirattatirattaṃ sahaseyyaṃ, [4.6]
và những quyền lợi mà các sa di khác được hưởng như được nằm nghỉ chung với các tỳ khưu hai hoặc ba đêm,
sāpi te natthi, cara pire, vinassā”ti. [2.4]
đạo hữu cũng không còn nữa. Hãy đi đi, đồ hư hỏng, hãy cút đi".
Yo pana bhikkhu jānaṃ tathānāsitaṃ samaṇuddesaṃ upalāpeyya vā, upaṭṭhāpeyya vā, [4.9]
Vị tỳ khưu nào biết rõ vị sa di đã bị trục xuất như vậy mà vẫn dỗ dành, hoặc phục vụ,
sambhuñjeyya vā, saha vā seyyaṃ kappeyya, pācittiyaṃ. Sappāṇakavaggo sattamo. [5.8]
hoặc cùng ăn chung, hoặc cùng nằm nghỉ chung, phạm tội Ưng Đối Trị. Chương về Chúng sinh là chương thứ bảy.`
},

{
    id: 'Pc.71', title: 'Pācittiya 71', audio: '5Pc-71.mp3',
    text: `Yo pana bhikkhu bhikkhūhi sahadhammikaṃ vuccamāno evaṃ vadeyya [4.3]
Vị tỳ khưu nào khi được các vị tỳ khưu khác nhắc nhở đúng pháp mà lại nói như vầy:
“na tāvāhaṃ, āvuso, etasmiṃ sikkhāpade sikkhissāmi, [3.7]
"Này đạo hữu, tôi sẽ không học tập điều học này,
yāva na aññaṃ bhikkhuṃ byattaṃ vinayadharaṃ paripucchāmī”ti, pācittiyaṃ. [4.3]
cho đến khi tôi hỏi một vị tỳ khưu khác thông thạo và am tường về Luật", phạm tội Ưng Đối Trị.
Sikkhamānena, bhikkhave, bhikkhunā aññātabbaṃ paripucchitabbaṃ paripañhitabbaṃ, ayaṃ tattha sāmīci. [6.0]
Này các tỳ khưu, vị tỳ khưu đang học tập cần phải hiểu biết, cần phải hỏi han, cần phải tìm tòi; đó là phương cách đúng đắn trong trường hợp này.`
},

{
    id: 'Pc.72', title: 'Pācittiya 72', audio: '5Pc-72.mp3',
    text: `Yo pana bhikkhu pātimokkhe uddissamāne evaṃ vadeyya [3.1]
Vị tỳ khưu nào trong khi giới bổn Pātimokkha đang được tụng đọc mà lại nói như vầy:
“kiṃ panimehi khuddānukhuddakehi sikkhāpadehi uddiṭṭhehi, [3.5]
"Việc tụng đọc các điều học nhỏ nhặt này để làm gì,
yāvadeva kukkuccāya vihesāya vilekhāya saṃvattantī”ti, sikkhāpadavivaṇṇake pācittiyaṃ. [6.0]
chúng chỉ dẫn đến sự hối hận, phiền muộn và bối rối mà thôi"; vì lời chê bai các điều học, phạm tội Ưng Đối Trị.`
},

{
    id: 'Pc.73', title: 'Pācittiya 73', audio: '5Pc-73.mp3',
    text: `Yo pana bhikkhu anvaddhamāsaṃ pātimokkhe uddissamāne evaṃ vadeyya [4.0]
Vị tỳ khưu nào trong khi giới bổn Pātimokkha đang được tụng đọc mỗi nửa tháng mà lại nói như vầy:
“idāneva kho ahaṃ jānāmi, ayampi kira dhammo suttāgato suttapariyāpanno anvaddhamāsaṃ uddesaṃ āgacchatī”ti. [6.6]
"Đến bây giờ tôi mới biết, hóa ra pháp này đã có trong kinh điển, thuộc về kinh điển, và được tụng đọc mỗi nửa tháng".
Tañce bhikkhuṃ aññe bhikkhū jāneyyuṃ: “nisinnapubbaṁ iminā bhikkhunā [4.3]
Nếu các vị tỳ khưu khác biết rằng vị tỳ khưu này đã từng ngồi dự
dvattikkhattuṁ pātimokkhe uddissamāne, ko pana vādo bhiyyo” ti, [3.9]
buổi tụng Pātimokkha hai hoặc ba lần, hoặc thậm chí nhiều hơn nữa,
na ca tassa bhikkhuno aññāṇakena mutti atthi, yañca tattha āpattiṃ āpanno, [4.4]
thì vị tỳ khưu ấy không thể thoát tội bằng cách lấy lý do không biết; và đối với tội mà vị ấy đã phạm,
tañca yathādhammo kāretabbo, uttariṃ cassa moho āropetabbo [4.3]
vị ấy phải bị xử lý theo đúng pháp, và hơn nữa phải bị kết tội cố ý làm ngơ rằng:
“tassa te, āvuso, alābhā, tassa te dulladdhaṃ, [3.1]
"Này đạo hữu, đó là sự mất mát của ông, đó là điều không may cho ông,
yaṃ tvaṃ pātimokkhe uddissamāne na sādhukaṃ aṭṭhikatvā manasi karosī”ti, [4.7]
khi giới bổn Pātimokkha đang được tụng đọc mà ông không chịu chú tâm lắng nghe một cách kỹ lưỡng";
idaṃ tasmiṃ mohanake pācittiyaṃ. [2.7]
đây là tội Ưng Đối Trị vì sự cố ý làm ngơ.`
},

{
    id: 'Pc.74', title: 'Pācittiya 74', audio: '5Pc-74.mp3',
    text: `Yo pana bhikkhu bhikkhussa kupito anattamano pahāraṃ dadeyya, pācittiyaṃ. [4.6]
Vị tỳ khưu nào vì tức giận, không hài lòng mà đánh một vị tỳ khưu khác, phạm tội Ưng Đối Trị.`
},

{
    id: 'Pc.75', title: 'Pācittiya 75', audio: '5Pc-75.mp3',
    text: `Yo pana bhikkhu bhikkhussa kupito anattamano talasattikaṃ uggireyya, pācittiyaṃ. [4.8]
Vị tỳ khưu nào vì tức giận, không hài lòng mà giơ tay (dọa đánh) một vị tỳ khưu khác, phạm tội Ưng Đối Trị.`
},

{
    id: 'Pc.76', title: 'Pācittiya 76', audio: '5Pc-76.mp3',
    text: `Yo pana bhikkhu bhikkhuṃ amūlakena saṅghādisesena anuddhaṃseyya, pācittiyaṃ. [4.8]
Vị tỳ khưu nào buộc tội một vị tỳ khưu khác bằng tội Tăng Tàn không có căn cứ, phạm tội Ưng Đối Trị.`
},

{
    id: 'Pc.77', title: 'Pācittiya 77', audio: '5Pc-77.mp3',
    text: `Yo pana bhikkhu bhikkhussa sañcicca kukkuccaṃ upadaheyya “itissa muhuttampi aphāsu bhavissatī”ti [5.1]
Vị tỳ khưu nào cố ý gây ra sự hối hận (hoặc bối rối) cho một vị tỳ khưu khác (với ý nghĩ): "Như vậy vị ấy sẽ cảm thấy không thoải mái dù chỉ trong chốc lát",
etadeva paccayaṃ karitvā anaññaṃ, pācittiyaṃ. [3.6]
chỉ lấy lý do đó chứ không vì lý do nào khác, phạm tội Ưng Đối Trị.`
},

{
    id: 'Pc.78', title: 'Pācittiya 78', audio: '5Pc-78.mp3',
    text: `Yo pana bhikkhu bhikkhūnaṃ bhaṇḍanajātānaṃ kalahajātānaṃ vivādāpannānaṃ upassutiṃ tiṭṭheyya [6.3]
Vị tỳ khưu nào đi nghe lén các vị tỳ khưu đang tranh chấp, cãi cọ, mâu thuẫn (với ý nghĩ):
“yaṃ ime bhaṇissanti, taṃ sossāmī”ti etadeva paccayaṃ karitvā anaññaṃ, pācittiyaṃ. [5.3]
"Họ nói gì mình sẽ nghe cái đó", chỉ lấy lý do đó chứ không vì lý do nào khác, phạm tội Ưng Đối Trị.`
},

{
    id: 'Pc.79', title: 'Pācittiya 79', audio: '5Pc-79.mp3',
    text: `Yo pana bhikkhu dhammikānaṃ kammānaṃ chandaṃ datvā pacchā khīyanadhammaṃ āpajjeyya, pācittiyaṃ. [6.3]
Vị tỳ khưu nào sau khi đã đồng thuận (gởi thẻ biểu quyết) cho các việc Tăng Sự đúng pháp, rồi sau đó lại lên tiếng chỉ trích (vị làm Tăng Sự), phạm tội Ưng Đối Trị.`
},

{
    id: 'Pc.80', title: 'Pācittiya 80', audio: '5Pc-80.mp3',
    text: `Yo pana bhikkhu saṅghe vinicchayakathāya vattamānāya chandaṃ adatvā uṭṭhāyāsanā pakkameyya, pācittiyaṃ. [6.5]
Vị tỳ khưu nào khi Tăng chúng đang tiến hành thảo luận để quyết định một vụ việc, mà lại rời khỏi chỗ ngồi bỏ đi khi chưa đưa ra sự đồng thuận, phạm tội Ưng Đối Trị.`
},

{
    id: 'Pc.81', title: 'Pācittiya 81', audio: '5Pc-81.mp3',
    text: `Yo pana bhikkhu samaggena saṅghena cīvaraṃ datvā pacchā khīyanadhammaṃ āpajjeyya [5.0]
Vị tỳ khưu nào đã cùng với Tăng chúng hòa hợp dâng y (cho một vị nào đó), rồi sau đó lại lên tiếng chỉ trích rằng:
“yathāsanthutaṃ bhikkhū saṅghikaṃ lābhaṃ pariṇāmentī”ti, pācittiyaṃ. [4.3]
"Các vị tỳ khưu trao vật dụng của Tăng chúng theo sự thân tình", phạm tội Ưng Đối Trị.`
},

{
    id: 'Pc.82', title: 'Pācittiya 82', audio: '5Pc-82.mp3',
    text: `Yo pana bhikkhu jānaṃ saṅghikaṃ lābhaṃ pariṇataṃ puggalassa pariṇāmeyya, pācittiyaṃ. Sahadhammikavaggo aṭṭhamo. [6.6]
Vị tỳ khưu nào biết rõ vật dụng đã được dành để dâng đến Tăng chúng mà lại chuyển sang cho riêng cá nhân mình, phạm tội Ưng Đối Trị. Chương về Đúng Pháp là chương thứ tám.`
},

{
    id: 'Pc.83', title: 'Pācittiya 83', audio: '5Pc-83.mp3',
    text: `Yo pana bhikkhu rañño khattiyassa muddhābhisittassa anikkhantarājake aniggataratanake [5.0]
Vị tỳ khưu nào đi vào ngưỡng cửa cung điện của vua Sát-đế-lỵ đã làm lễ quán đảnh, khi nhà vua chưa rời khỏi, hoàng hậu chưa bước ra,
pubbe appaṭisaṃvidito indakhīlaṃ atikkāmeyya, pācittiyaṃ. [4.5]
khi chưa được thông báo trước, phạm tội Ưng Đối Trị.`
},

{
    id: 'Pc.84', title: 'Pācittiya 84', audio: '5Pc-84.mp3',
    text: `Yo pana bhikkhu ratanaṃ vā ratanasammataṃ vā aññatra ajjhārāmā vā ajjhāvasathā vā uggaṇheyya vā uggaṇhāpeyya vā, pācittiyaṃ. [7.8]
Vị tỳ khưu nào tự mình nhặt hoặc bảo người khác nhặt đồ trang sức hay vật được coi là đồ trang sức, ngoại trừ ở trong tu viện hoặc tại trú xá, phạm tội Ưng Đối Trị.
Ratanaṃ vā pana bhikkhunā ratanasammataṃ vā ajjhārāme vā ajjhāvasathe vā uggahetvā vā uggahāpetvā vā nikkhipitabbaṃ [6.8]
Tuy nhiên, nếu vị tỳ khưu nhặt hoặc bảo người khác nhặt đồ trang sức hay vật được coi là đồ trang sức ở trong tu viện hoặc tại trú xá, thì vật ấy phải được cất giữ với ý nghĩ:
“yassa bhavissati, so harissatī”ti, ayaṃ tattha sāmīci. [3.7]
"Người nào làm mất sẽ đến nhận lại"; đó là phương cách đúng đắn trong trường hợp này.`
},

{
    id: 'Pc.85', title: 'Pācittiya 85', audio: '5Pc-85.mp3',
    text: `Yo pana bhikkhu santaṃ bhikkhuṃ anāpucchā vikāle gāmaṃ paviseyya [4.0]
Vị tỳ khưu nào đi vào làng vào phi thời mà không xin phép một vị tỳ khưu khác đang có mặt ở đó,
aññatra tathārūpā accāyikā karaṇīyā, pācittiyaṃ. [4.0]
ngoại trừ khi có việc khẩn cấp tương tự, phạm tội Ưng Đối Trị.`
},

{
    id: 'Pc.86', title: 'Pācittiya 86', audio: '5Pc-86.mp3',
    text: `Yo pana bhikkhu aṭṭhimayaṃ vā dantamayaṃ vā visāṇamayaṃ vā sūcigharaṃ kārāpeyya, bhedanakaṃ pācittiyaṃ. [6.2]
Vị tỳ khưu nào cho làm ống đựng kim bằng xương, hoặc bằng ngà, hoặc bằng sừng, phạm tội Ưng Đối Trị phải phá hủy (ống kim đó).`
},

{
    id: 'Pc.87', title: 'Pācittiya 87', audio: '5Pc-87.mp3',
    text: `Navaṃ pana bhikkhunā mañcaṃ vā pīṭhaṃ vā kārayamānena aṭṭhaṅgulapādakaṃ kāretabbaṃ [5.4]
Khi vị tỳ khưu cho làm giường hoặc ghế mới, phải làm chân cao tám ngón tay
sugataṅgulena aññatra heṭṭhimāya aṭaniyā. Taṃ atikkāmayato chedanakaṃ pācittiyaṃ. [6.0]
theo ngón tay của Đức Phật, ngoại trừ phần khung giường ở bên dưới. Nếu vượt quá mức đó, phạm tội Ưng Đối Trị phải cắt bớt (chân giường ghế).`
},

{
    id: 'Pc.88', title: 'Pācittiya 88', audio: '5Pc-88.mp3',
    text: `Yo pana bhikkhu mañcaṃ vā pīṭhaṃ vā tūlonaddhaṃ kārāpeyya, uddālanakaṃ pācittiyaṃ. [6.0]
Vị tỳ khưu nào cho làm giường hoặc ghế có nhồi bông vải, phạm tội Ưng Đối Trị phải tháo gỡ (bông vải ra).`
},

{
    id: 'Pc.89', title: 'Pācittiya 89', audio: '5Pc-89.mp3',
    text: `Nisīdanaṃ pana bhikkhunā kārayamānena pamāṇikaṃ kāretabbaṃ, [4.1]
Khi vị tỳ khưu cho làm tọa cụ, phải làm đúng kích thước;
tatridaṃ pamāṇaṃ, dīghaso dve vidatthiyo sugatavidatthiyā, tiriyaṃ diyaḍḍhaṃ, dasā vidatthi. [5.3]
kích thước ở đây là: chiều dài hai gang tay, chiều rộng một gang rưỡi, đường viền rộng một gang (theo gang tay Đức Phật).
Taṃ atikkāmayato chedanakaṃ pācittiyaṃ. [3.3]
Nếu vượt quá mức đó, phạm tội Ưng Đối Trị phải cắt bớt.`
},

{
    id: 'Pc.90', title: 'Pācittiya 90', audio: '5Pc-90.mp3',
    text: `Kaṇḍuppaṭicchādiṃ pana bhikkhunā kārayamānena pamāṇikā kāretabbā, tatridaṃ pamāṇaṃ, [5.4]
Khi vị tỳ khưu cho làm vải che ghẻ, phải làm đúng kích thước; kích thước ở đây là:
dīghaso catasso vidatthiyo sugatavidatthiyā, tiriyaṃ dve vidatthiyo. [3.8]
chiều dài bốn gang tay, chiều rộng hai gang tay (theo gang tay Đức Phật).
Taṃ atikkāmayato chedanakaṃ pācittiyaṃ. [3.3]
Nếu vượt quá mức đó, phạm tội Ưng Đối Trị phải cắt bớt.`
},

{
    id: 'Pc.91', title: 'Pācittiya 91', audio: '5Pc-91.mp3',
    text: `Vassikasāṭikaṃ pana bhikkhunā kārayamānena pamāṇikā kāretabbā, [4.45]
Khi vị tỳ khưu cho làm y tắm mưa, phải làm đúng kích thước;
tatridaṃ pamāṇaṃ, dīghaso cha vidatthiyo sugatavidatthiyā, tiriyaṃ aḍḍhateyyā. Taṃ atikkāmayato chedanakaṃ pācittiyaṃ. [7.0]
kích thước ở đây là: chiều dài sáu gang tay, chiều rộng hai gang rưỡi (theo gang tay Đức Phật). Nếu vượt quá mức đó, phạm tội Ưng Đối Trị phải cắt bớt.`
},

{
    id: 'Pc.92', title: 'Pācittiya 92', audio: '5Pc-92.mp3',
    text: `Yo pana bhikkhu sugatacīvarappamāṇaṃ cīvaraṃ kārāpeyya, atirekaṃ vā, chedanakaṃ pācittiyaṃ. [5.4]
Vị tỳ khưu nào cho may y bằng hoặc lớn hơn kích thước y của Đức Phật, phạm tội Ưng Đối Trị phải cắt bớt.
Tatridaṃ sugatassa sugatacīvarappamāṇaṃ, [2.65]
Ở đây, kích thước y của Đức Phật là:
dīghaso nava vidatthiyo sugatavidatthiyā, tiriyaṃ cha vidatthiyo, idaṃ sugatassa sugatacīvarappamāṇaṃ. [5.4]
chiều dài chín gang tay, chiều rộng sáu gang tay (theo gang tay Đức Phật); đây là kích thước y của Đức Phật.
Ratanavaggo navamo. [2.5]
Chương về Đồ Trang Sức là chương thứ chín.`
},

{
    id: 'Pc.U', title: 'Pācittiya Uddiṭṭhā', audio: '5Pc-U.mp3',
    text: `Uddiṭṭhā kho āyasmanto dvenavuti pācittiyā dhammā. Tatthāyasmante pucchāmi, kaccittha parisuddhā, [5.5]
Này các đại đức, chín mươi hai pháp Ưng Đối Trị đã được tụng đọc xong. Trong phần này tôi xin hỏi các đại đức: Các đại đức có trong sạch không?
dutiyampi pucchāmi, kaccittha parisuddhā, tatiyampi pucchāmi, kaccittha parisuddhā, [4.0]
Tôi xin hỏi lần thứ nhì: Các đại đức có trong sạch không? Tôi xin hỏi lần thứ ba: Các đại đức có trong sạch không?
parisuddhetthāyasmanto, tasmā tuṇhī, evametaṃ dhārayāmīti. [4.2]
Các đại đức trong sạch, do đó mới im lặng. Tôi xin ghi nhận sự việc như vậy.
Pācittiyā dhammā niṭṭhitā. [3.0]
Các pháp Ưng Đối Trị đã kết thúc.`
},

{
    id: 'Pd.1', title: 'Pāṭidesanīya 1', audio: '6Pd-01.mp3',
    text: `Ime kho panāyasmanto cattāro pāṭidesanīyā Dhammā uddesaṃ āgacchanti. [5.4]
Này các đại đức, đây là bốn pháp Ưng Phát Lộ được tụng đọc đến.
Yo pana bhikkhu aññātikāya bhikkhuniyā antaragharaṃ paviṭṭhāya hatthato khādanīyaṃ vā bhojanīyaṃ vā [5.6]
Vị tỳ khưu nào tự tay thọ nhận thức ăn cứng hoặc thức ăn mềm từ tay của một tỳ khưu ni không phải thân quyến đang đi vào trong làng,
sahatthā paṭiggahetvā khādeyya vā bhuñjeyya vā, paṭidesetabbaṃ [4.0]
rồi dùng vật thực ấy, thì phải phát lộ rằng:
tena bhikkhunā “gārayhaṃ, āvuso, dhammaṃ āpajjiṃ asappāyaṃ [3.9]
"Này đạo hữu, tôi đã phạm một lỗi đáng khiển trách, không thích đáng,
pāṭidesanīyaṃ, taṃ paṭidesemī”ti. [3.0]
một lỗi cần phải phát lộ, tôi xin phát lộ lỗi ấy".`
},

{
    id: 'Pd.2', title: 'Pāṭidesanīya 2', audio: '6Pd-02.mp3',
    text: `Bhikkhū paneva kulesu nimantitā bhuñjanti, tatra ce sā bhikkhunī vosāsamānarūpā [5.1]
Có các vị tỳ khưu đang thọ thực do được thỉnh mời tại các gia đình, và tại đó có một tỳ khưu ni đứng ra chỉ thị rằng:
ṭhitā hoti “idha sūpaṃ detha, idha odanaṃ dethā”ti. [3.5]
"Hãy dâng canh vào chỗ này, hãy dâng cơm vào chỗ kia".
Tehi bhikkhūhi sā bhikkhunī apasādetabbā “apasakka tāva bhagini, [4.0]
Các vị tỳ khưu ấy nên bảo tỳ khưu ni ấy rằng: "Này cô, hãy tránh ra cho đến khi các tỳ khưu thọ thực xong".
yāva bhikkhū bhuñjantī”ti. Ekassapi ce bhikkhuno nappaṭibhāseyya taṃ bhikkhuniṃ apasādetuṃ [6.1]
Nếu không có vị tỳ khưu nào đứng ra bảo tỳ khưu ni ấy rằng:
“apasakka tāva bhagini, yāva bhikkhū bhuñjantī”ti, paṭidesetabbaṃ [3.9]
"Này cô, hãy tránh ra cho đến khi các tỳ khưu thọ thực xong", thì tất cả các vị tỳ khưu ấy phải phát lộ rằng:
tehi bhikkhūhi “gārayhaṃ, āvuso, dhammaṃ āpajjimhā asappāyaṃ pāṭidesanīyaṃ, [5.0]
"Này đạo hữu, chúng tôi đã phạm một lỗi đáng khiển trách, không thích đáng, một lỗi cần phải phát lộ,
taṃ paṭidesemā”ti. [2.1]
chúng tôi xin phát lộ lỗi ấy".`
},

{
    id: 'Pd.3', title: 'Pāṭidesanīya 3', audio: '6Pd-03.mp3',
    text: `Yāni kho pana tāni sekhasammatāni kulāni, yo pana bhikkhu tathārūpesu sekhasammatesukulesu pubbe animantito [6.85]
Có những gia đình được (Tăng) công nhận là đang trong giai đoạn tu học (cần được hỗ trợ); vị tỳ khưu nào không được mời trước mà đến những gia đình như vậy,
agilāno khādanīyaṃ vā, bhojanīyaṃ vā sahatthā paṭiggahetvā [3.9]
trong khi không bị bệnh, lại tự tay thọ nhận thức ăn cứng hoặc thức ăn mềm
khādeyya vā, bhuñjeyya vā, paṭidesetabbaṃ [2.85]
rồi dùng vật thực ấy, thì phải phát lộ rằng:
tena bhikkhunā “gārayhaṃ, āvuso, dhammaṃ āpajjiṃ asappāyaṃ pāṭidesanīyaṃ, taṃ paṭidesemī”ti. [6.4]
"Này đạo hữu, tôi đã phạm một lỗi đáng khiển trách, không thích đáng, một lỗi cần phải phát lộ, tôi xin phát lộ lỗi ấy".`
},

{
    id: 'Pd.4', title: 'Pāṭidesanīya 4', audio: '6Pd-04.mp3',
    text: `Yāni kho pana tāni āraññakāni senāsanāni sāsaṅkasammatāni sappaṭibhayāni, [5.1]
Có những trú xứ trong rừng được xem là nguy hiểm và đáng sợ;
yo pana bhikkhu tathārūpesu senāsanesu viharanto [3.3]
vị tỳ khưu đang sống ở những trú xứ như thế,
pubbe appaṭisaṃviditaṃ khādanīyaṃ vā, bhojanīyaṃ vā ajjhārāme sahatthā paṭiggahetvā [5.45]
nếu tự tay thọ nhận thức ăn cứng hoặc thức ăn mềm tại tu viện mà không được thông báo trước,
agilāno khādeyya vā, bhuñjeyya vā, paṭidesetabbaṃ [3.45]
trong khi không bị bệnh mà lại dùng vật thực ấy, thì phải phát lộ rằng:
tena bhikkhunā “gārayhaṃ, āvuso, dhammaṃ āpajjiṃ asappāyaṃ pāṭidesanīyaṃ, taṃ paṭidesemī”ti. [6.5]
"Này đạo hữu, tôi đã phạm một lỗi đáng khiển trách, không thích đáng, một lỗi cần phải phát lộ, tôi xin phát lộ lỗi ấy".`
},

{
    id: 'Pd.U', title: 'Pāṭidesanīya Uddiṭṭhā', audio: '6Pd-U.mp3',
    text: `Uddiṭṭhā kho āyasmanto cattāro pāṭidesanīyā dhammā. [3.7]
Này các đại đức, bốn pháp Ưng Phát Lộ đã được tụng đọc xong.
Tatthāyasmante pucchāmi, kaccittha parisuddhā, dutiyampi pucchāmi, kaccittha parisuddhā, [4.4]
Trong phần này tôi xin hỏi các đại đức: Các đại đức có trong sạch không? Tôi xin hỏi lần thứ nhì: Các đại đức có trong sạch không?
tatiyampi pucchāmi, kaccittha parisuddhā, [2.3]
Tôi xin hỏi lần thứ ba: Các đại đức có trong sạch không?
parisuddhetthāyasmanto, tasmā tuṇhī, evametaṃ dhārayāmīti. [4.2]
Các đại đức trong sạch, do đó mới im lặng. Tôi xin ghi nhận sự việc như vậy.
Pāṭidesanīyā Niṭṭhitā. [2.6]
Các pháp Ưng Phát Lộ đã kết thúc.`
},

 

 


{
    id: 'Sk.1-2', title: 'Sekhiya 1-2', audio: '7Sk-01-02.mp3',
    text: `Ime kho panāyasmanto sekhiyā dhammā uddesaṃ āgacchanti. [4.1]
Này các đại đức, đây là các Ưng Học Pháp được tụng đọc đến.
Parimaṇḍalaṃ nivāsessāmīti sikkhā karaṇīyā. Parimaṇḍalaṃ pārupissāmīti sikkhā karaṇīyā. [5.3]
"Ta sẽ mặc y nội cho tròn đều (phía trên che rốn, phía dưới che đầu gối)", là điều cần phải học tập. "Ta sẽ đắp y vai cho tròn trịa", là điều cần phải học tập.`
},

{
    id: 'Sk.3-4', title: 'Sekhiya 3-4', audio: '7Sk-03-04.mp3',
    text: `Supaṭicchanno antaraghare gamissāmīti sikkhā karaṇīyā. Supaṭicchanno antaraghare nisīdissāmīti sikkhā karaṇīyā. [6.0]
"Ta sẽ khéo che kín thân mình khi đi vào xóm nhà", là điều cần phải học tập. "Ta sẽ khéo che kín thân mình khi ngồi trong xóm nhà", là điều cần phải học tập.`
},

{
    id: 'Sk.5-6', title: 'Sekhiya 5-6', audio: '7Sk-05-06.mp3',
    text: `Susaṃvuto antaraghare gamissāmīti sikkhā karaṇīyā. Susaṃvuto antaraghare nisīdissāmīti sikkhā karaṇīyā. [5.8]
"Ta sẽ khéo thu thúc (thu thúc lục căn) khi đi vào xóm nhà", là điều cần phải học tập. "Ta sẽ khéo thu thúc khi ngồi trong xóm nhà", là điều cần phải học tập.`
},

{
    id: 'Sk.7-8', title: 'Sekhiya 7-8', audio: '7Sk-07-08.mp3',
    text: `Okkhittacakkhu antaraghare gamissāmīti sikkhā karaṇīyā. Okkhittacakkhu antaraghare nisīdissāmīti sikkhā karaṇīyā. [6.0]
"Ta sẽ đi mắt nhìn xuống khi đi vào xóm nhà", là điều cần phải học tập. "Ta sẽ ngồi mắt nhìn xuống khi ngồi trong xóm nhà", là điều cần phải học tập.`
},

{
    id: 'Sk.9-10', title: 'Sekhiya 9-10', audio: '7Sk-09-10.mp3',
    text: `Na ukkhittakāya antaraghare gamissāmīti sikkhā karaṇīyā. Na ukkhittakāya antaraghare nisīdissāmīti sikkhā karaṇīyā. [5.6]
"Ta sẽ không vén y lên cao khi đi vào xóm nhà", là điều cần phải học tập. "Ta sẽ không vén y lên cao khi ngồi trong xóm nhà", là điều cần phải học tập.
Parimaṇḍalavaggo paṭhamo. [3.0]
Chương Tròn Đều là chương thứ nhất.`
},

{
    id: 'Sk.11-12', title: 'Sekhiya 11-12', audio: '7Sk-11-12.mp3',
    text: `Na ujjagghikāya antaraghare gamissāmīti sikkhā karaṇīyā. Na ujjagghikāya antaraghare nisīdissāmīti sikkhā karaṇīyā. [6.3]
"Ta sẽ không cười lớn tiếng khi đi vào xóm nhà", là điều cần phải học tập. "Ta sẽ không cười lớn tiếng khi ngồi trong xóm nhà", là điều cần phải học tập.`
},

{
    id: 'Sk.13-14', title: 'Sekhiya 13-14', audio: '7Sk-13-14.mp3',
    text: `Appasaddo antaraghare gamissāmīti sikkhā karaṇīyā. Appasaddo antaraghare nisīdissāmīti sikkhā karaṇīyā. [5.5]
"Ta sẽ đi khẽ tiếng khi đi vào xóm nhà", là điều cần phải học tập. "Ta sẽ ngồi khẽ tiếng khi ngồi trong xóm nhà", là điều cần phải học tập.`
},

{
    id: 'Sk.15-16', title: 'Sekhiya 15-16', audio: '7Sk-15-16.mp3',
    text: `Na kāyappacālakaṃ antaraghare gamissāmīti sikkhā karaṇīyā. Na kāyappacālakaṃ antaraghare nisīdissāmīti sikkhā karaṇīyā. [6.0]
"Ta sẽ không vừa đi vừa lắc mình khi đi vào xóm nhà", là điều cần phải học tập. "Ta sẽ không vừa ngồi vừa lắc mình khi ngồi trong xóm nhà", là điều cần phải học tập.`
},

{
    id: 'Sk.17-18', title: 'Sekhiya 17-18', audio: '7Sk-17-18.mp3',
    text: `Na bāhuppacālakaṃ antaraghare gamissāmīti sikkhā karaṇīyā. Na bāhuppacālakaṃ antaraghare nisīdissāmīti sikkhā karaṇīyā. [5.8]
"Ta sẽ không vừa đi vừa vung tay khi đi vào xóm nhà", là điều cần phải học tập. "Ta sẽ không vừa ngồi vừa vung tay khi ngồi trong xóm nhà", là điều cần phải học tập.`
},

{
    id: 'Sk.19-20', title: 'Sekhiya 19-20', audio: '7Sk-19-20.mp3',
    text: `Na sīsappacālakaṃ antaraghare gamissāmīti sikkhā karaṇīyā. Na sīsappacālakaṃ antaraghare nisīdissāmīti sikkhā karaṇīyā. [5.5]
"Ta sẽ không vừa đi vừa lắc đầu khi đi vào xóm nhà", là điều cần phải học tập. "Ta sẽ không vừa ngồi vừa lắc đầu khi ngồi trong xóm nhà", là điều cần phải học tập.
Ujjagghikavaggo dutiyo. [2.4]
Chương Cười Lớn là chương thứ hai.`
},

{
    id: 'Sk.21-22', title: 'Sekhiya 21-22', audio: '7Sk-21-22.mp3',
    text: `Na khambhakato antaraghare gamissāmīti sikkhā karaṇīyā. [2.95]
"Ta sẽ không chống nạnh khi đi vào xóm nhà", là điều cần phải học tập.
Na khambhakato antaraghare nisīdissāmīti sikkhā karaṇīyā. [3.4]
"Ta sẽ không chống nạnh khi ngồi trong xóm nhà", là điều cần phải học tập.`
},

{
    id: 'Sk.23-24', title: 'Sekhiya 23-24', audio: '7Sk-23-24.mp3',
    text: `Na oguṇṭhito antaraghare gamissāmīti sikkhā karaṇīyā. Na oguṇṭhito antaraghare nisīdissāmīti sikkhā karaṇīyā. [6.2]
"Ta sẽ không trùm đầu khi đi vào xóm nhà", là điều cần phải học tập. "Ta sẽ không trùm đầu khi ngồi trong xóm nhà", là điều cần phải học tập.`
},

{
    id: 'Sk.25-26', title: 'Sekhiya 25-26', audio: '7Sk-25-26.mp3',
    text: `Na ukkuṭikāya antaraghare gamissāmīti sikkhā karaṇīyā. Na pallatthikāya antaraghare nisīdissāmīti sikkhā karaṇīyā. [6.0]
"Ta sẽ không đi bằng nhón gót khi đi vào xóm nhà", là điều cần phải học tập. "Ta sẽ không ngồi bó gối khi ngồi trong xóm nhà", là điều cần phải học tập.`
},

{
    id: 'Sk.27-28', title: 'Sekhiya 27-28', audio: '7Sk-27-28.mp3',
    text: `Sakkaccaṃ piṇḍapātaṃ paṭiggahessāmīti sikkhā karaṇīyā. [2.9]
"Ta sẽ thọ nhận vật thực một cách trân trọng", là điều cần phải học tập.
Pattasaññī piṇḍapātaṃ paṭiggahessāmīti sikkhā karaṇīyā. [3.5]
"Ta sẽ thọ nhận vật thực với tâm chú nguyện vào bát", là điều cần phải học tập.`
},

{
    id: 'Sk.29-30', title: 'Sekhiya 29-30', audio: '7Sk-29-30.mp3',
    text: `Samasūpakaṃ piṇḍapātaṃ paṭiggahessāmīti sikkhā karaṇīyā. Samatittikaṃ piṇḍapātaṃ paṭiggahessāmīti sikkhā karaṇīyā. [5.9]
"Ta sẽ thọ nhận vật thực với lượng canh vừa đủ", là điều cần phải học tập. "Ta sẽ thọ nhận vật thực vừa ngang với miệng bát", là điều cần phải học tập.
Khambhakatavaggo tatiyo. [2.5]
Chương Chống Nạnh là chương thứ ba.`
},

{
    id: 'Sk.31-32', title: 'Sekhiya 31-32', audio: '7Sk-31-32.mp3',
    text: `Sakkaccaṃ piṇḍapātaṃ bhuñjissāmīti sikkhā karaṇīyā. Pattasaññī piṇḍapātaṃ bhuñjissāmīti sikkhā karaṇīyā. [5.8]
"Ta sẽ ăn vật thực một cách trân trọng", là điều cần phải học tập. "Ta sẽ ăn vật thực với tâm chú nguyện vào bát", là điều cần phải học tập.`
},

{
    id: 'Sk.33-34', title: 'Sekhiya 33-34', audio: '7Sk-33-34.mp3',
    text: `Sapadānaṃ piṇḍapātaṃ bhuñjissāmīti sikkhā karaṇīyā. Samasūpakaṃ piṇḍapātaṃ bhuñjissāmīti sikkhā karaṇīyā. [5.8]
"Ta sẽ ăn vật thực theo thứ tự từng phần", là điều cần phải học tập. "Ta sẽ ăn vật thực với lượng canh vừa đủ", là điều cần phải học tập.`
},

{
    id: 'Sk.35-36', title: 'Sekhiya 35-36', audio: '7Sk-35-36.mp3',
    text: `Na thūpakato omadditvā piṇḍapātaṃ bhuñjissāmīti sikkhā karaṇīyā. Na sūpaṃ vā byañjanaṃ vā [5.0]
"Ta sẽ không bới vật thực từ trên đỉnh xuống để ăn", là điều cần phải học tập. "Ta sẽ không lấy cơm che khuất canh hay đồ ăn
odanena paṭicchādessāmi bhiyyokamyataṃ upādāyāti sikkhā karaṇīyā. [4.3]
vì muốn được người ta cho thêm", là điều cần phải học tập.`
},

{
    id: 'Sk.37', title: 'Sekhiya 37', audio: '7Sk-37.mp3',
    text: `Na sūpaṃ vā odanaṃ vā agilāno attano atthāya viññāpetvā bhuñjissāmīti sikkhā karaṇīyā. [5.5]
"Ta không bị bệnh thì sẽ không xin canh hay cơm để tự mình ăn", là điều cần phải học tập.`
},

{
    id: 'Sk.38', title: 'Sekhiya 38', audio: '7Sk-38.mp3',
    text: `Na ujjhānasaññī paresaṃ pattaṃ olokessāmīti sikkhā karaṇīyā. [4.3]
"Ta sẽ không với tâm chê bai mà nhìn vào bát của người khác", là điều cần phải học tập.`
},

{
    id: 'Sk.39-40', title: 'Sekhiya 39-40', audio: '7Sk-39-40.mp3',
    text: `Nātimahantaṃ kabaḷaṃ karissāmīti sikkhā karaṇīyā. Parimaṇḍalaṃ ālopaṃ karissāmīti sikkhā karaṇīyā. Sakkaccavaggo catuttho. [7.5]
"Ta sẽ không ăn miếng quá lớn", là điều cần phải học tập. "Ta sẽ ăn miếng cơm tròn trịa", là điều cần phải học tập. Chương Thành Khẩn là chương thứ tư.`
},

{
    id: 'Sk.41-42', title: 'Sekhiya 41-42', audio: '7Sk-41-42.mp3',
    text: `Na anāhaṭe kabaḷe mukhadvāraṃ vivarissāmīti sikkhā karaṇīyā. Na bhuñjamāno sabbaṃ hatthaṃ mukhe pakkhipissāmīti sikkhā karaṇīyā. [7.5]
"Ta sẽ không há miệng khi miếng ăn chưa đưa đến", là điều cần phải học tập. "Ta sẽ không đưa cả bàn tay vào miệng khi đang ăn", là điều cần phải học tập.`
},

{
    id: 'Sk.43-44', title: 'Sekhiya 43-44', audio: '7Sk-43-44.mp3',
    text: `Na sakabaḷena mukhena byāharissāmīti sikkhā karaṇīyā. [3.2]
"Ta sẽ không vừa nhai vừa nói chuyện", là điều cần phải học tập.
Na piṇḍukkhepakaṃ bhuñjissāmīti sikkhā karaṇīyā. [3.3]
"Ta sẽ không vừa ăn vừa tung miếng ăn vào miệng", là điều cần phải học tập.`
},

{
    id: 'Sk.45-46', title: 'Sekhiya 45-46', audio: '7Sk-45-46.mp3',
    text: `Na kabaḷāvacchedakaṃ bhuñjissāmīti sikkhā karaṇīyā. [3.05]
"Ta sẽ không vừa ăn vừa cắn từng miếng", là điều cần phải học tập.
Na avagaṇḍakārakaṃ bhuñjissāmīti sikkhā karaṇīyā. [3.3]
"Ta sẽ không vừa ăn vừa phùng má", là điều cần phải học tập.`
},

{
    id: 'Sk.47-48', title: 'Sekhiya 47-48', audio: '7Sk-47-48.mp3',
    text: `Na hatthaniddhunakaṃ bhuñjissāmīti sikkhā karaṇīyā. [2.85]
"Ta sẽ không vừa ăn vừa vung tay", là điều cần phải học tập.
Na sitthāvakārakaṃ bhuñjissāmīti sikkhā karaṇīyā. [3.7]
"Ta sẽ không vừa ăn vừa làm rơi vãi hạt cơm", là điều cần phải học tập.`
},

{
    id: 'Sk.49-50', title: 'Sekhiya 49-50', audio: '7Sk-49-50.mp3',
    text: `Na jivhānicchārakaṃ bhuñjissāmīti sikkhā karaṇīyā. [3.36]
"Ta sẽ không vừa ăn vừa thè lưỡi", là điều cần phải học tập.
Na capucapukārakaṃ bhuñjissāmīti sikkhā karaṇīyā. Kabaḷavaggo pañcamo. [4.8]
"Ta sẽ không vừa ăn vừa nhai tóp tép", là điều cần phải học tập. Chương Miếng Ăn là chương thứ năm.`
},

{
    id: 'Sk.51-52', title: 'Sekhiya 51-52', audio: '7Sk-51-52.mp3',
    text: `Na surusurukārakaṃ bhuñjissāmīti sikkhā karaṇīyā. [3.1]
"Ta sẽ không vừa ăn vừa húp rột rột", là điều cần phải học tập.
Na hatthanillehakaṃ bhuñjissāmīti sikkhā karaṇīyā. [3.5]
"Ta sẽ không vừa ăn vừa liếm tay", là điều cần phải học tập.`
},

{
    id: 'Sk.53-54', title: 'Sekhiya 53-54', audio: '7Sk-53-54.mp3',
    text: `Na pattanillehakaṃ bhuñjissāmīti sikkhā karaṇīyā. [3.05]
"Ta sẽ không vừa ăn vừa liếm bát", là điều cần phải học tập.
Na oṭṭhanillehakaṃ bhuñjissāmīti sikkhā karaṇīyā. [3.6]
"Ta sẽ không vừa ăn vừa liếm môi", là điều cần phải học tập.`
},

{
    id: 'Sk.55', title: 'Sekhiya 55', audio: '7Sk-55.mp3',
    text: `Na sāmisena hatthena pānīyathālakaṃ paṭiggahessāmīti sikkhā karaṇīyā. [4.7]
"Ta sẽ không dùng bàn tay đang dính vật thực để cầm bình nước uống", là điều cần phải học tập.`
},

{
    id: 'Sk.56', title: 'Sekhiya 56', audio: '7Sk-56.mp3',
    text: `Na sasitthakaṃ pattadhovanaṃ antaraghare chaḍḍessāmīti sikkhā karaṇīyā. [4.5]
"Ta sẽ không đổ nước rửa bát có dính hạt cơm vào trong xóm nhà", là điều cần phải học tập.`
},

{
    id: 'Sk.57', title: 'Sekhiya 57', audio: '7Sk-57.mp3',
    text: `Na chattapāṇissa agilānassa dhammaṃ desessāmīti sikkhā karaṇīyā. [4.1]
"Ta sẽ không thuyết Pháp cho người không bị bệnh mà đang cầm lọng", là điều cần phải học tập.`
},

{
    id: 'Sk.58', title: 'Sekhiya 58', audio: '7Sk-58.mp3',
    text: `Na daṇḍapāṇissa agilānassa dhammaṃ desessāmīti sikkhā karaṇīyā. [4.1]
"Ta sẽ không thuyết Pháp cho người không bị bệnh mà đang cầm gậy", là điều cần phải học tập.`
},

{
    id: 'Sk.59', title: 'Sekhiya 59', audio: '7Sk-59.mp3',
    text: `Na satthapāṇissa agilānassa dhammaṃ desessāmīti sikkhā karaṇīyā. [4.1]
"Ta sẽ không thuyết Pháp cho người không bị bệnh mà đang cầm dao", là điều cần phải học tập.`
},

{
    id: 'Sk.60', title: 'Sekhiya 60', audio: '7Sk-60.mp3',
    text: `Na āvudhapāṇissa agilānassa dhammaṃ desessāmīti sikkhā karaṇīyā. Surusuruvaggo chaṭṭho. [6.6]
"Ta sẽ không thuyết Pháp cho người không bị bệnh mà đang cầm vũ khí", là điều cần phải học tập. Chương Húp Rột Rột là chương thứ sáu.`
},

{
    id: 'Sk.61', title: 'Sekhiya 61', audio: '7Sk-61.mp3',
    text: `Na pādukārūḷhassa agilānassa dhammaṃ desessāmīti sikkhā karaṇīyā. [4.8]
"Ta sẽ không thuyết Pháp cho người không bị bệnh mà đang mang guốc (giày cứng)", là điều cần phải học tập.`
},

{
    id: 'Sk.62', title: 'Sekhiya 62', audio: '7Sk-62.mp3',
    text: `Na upāhanārūḷhassa agilānassa dhammaṃ desessāmīti sikkhā karaṇīyā. [4.2]
"Ta sẽ không thuyết Pháp cho người không bị bệnh mà đang mang dép", là điều cần phải học tập.`
},

{
    id: 'Sk.63', title: 'Sekhiya 63', audio: '7Sk-63.mp3',
    text: `Na yānagatassa agilānassa dhammaṃ desessāmīti sikkhā karaṇīyā. [4.2]
"Ta sẽ không thuyết Pháp cho người không bị bệnh đang ngồi trên xe", là điều cần phải học tập.`
},

{
    id: 'Sk.64', title: 'Sekhiya 64', audio: '7Sk-64.mp3',
    text: `Na sayanagatassa agilānassa dhammaṃ desessāmīti sikkhā karaṇīyā. [4.1]
"Ta sẽ không thuyết Pháp cho người không bị bệnh đang nằm trên giường", là điều cần phải học tập.`
},

{
    id: 'Sk.65', title: 'Sekhiya 65', audio: '7Sk-65.mp3',
    text: `Na pallatthikāya nisinnassa agilānassa dhammaṃ desessāmīti sikkhā karaṇīyā. [4.7]
"Ta sẽ không thuyết Pháp cho người không bị bệnh đang ngồi bó gối", là điều cần phải học tập.`
},

{
    id: 'Sk.66', title: 'Sekhiya 66', audio: '7Sk-66.mp3',
    text: `Na veṭhitasīsassa agilānassa dhammaṃ desessāmīti sikkhā karaṇīyā. [4.5]
"Ta sẽ không thuyết Pháp cho người không bị bệnh đang quấn khăn trên đầu", là điều cần phải học tập.`
},

{
    id: 'Sk.67', title: 'Sekhiya 67', audio: '7Sk-67.mp3',
    text: `Na oguṇṭhitasīsassa agilānassa dhammaṃ desessāmīti sikkhā karaṇīyā. [4.5]
"Ta sẽ không thuyết Pháp cho người không bị bệnh đang trùm kín đầu", là điều cần phải học tập.`
},

{
    id: 'Sk.68', title: 'Sekhiya 68', audio: '7Sk-68.mp3',
    text: `Na chamāyaṃ nisīditvā āsane nisinnassa agilānassa [3.1]
"Ta sẽ không ngồi dưới đất mà thuyết Pháp cho người không bị bệnh đang ngồi trên ghế (chỗ cao)",
dhammaṃ desessāmīti sikkhā karaṇīyā. [3.0]
là điều cần phải học tập.`
},

{
    id: 'Sk.69', title: 'Sekhiya 69', audio: '7Sk-69.mp3',
    text: `Na nīce āsane nisīditvā ucce āsane nisinnassa agilānassa dhammaṃ desessāmīti sikkhā karaṇīyā. [6.1]
"Ta sẽ không ngồi trên ghế thấp thuyết Pháp cho người không bị bệnh đang ngồi trên ghế cao", là điều cần phải học tập.`
},

{
    id: 'Sk.70', title: 'Sekhiya 70', audio: '7Sk-70.mp3',
    text: `Na ṭhito nisinnassa agilānassa dhammaṃ desessāmīti sikkhā karaṇīyā. [4.5]
"Ta sẽ không đứng thuyết Pháp cho người không bị bệnh đang ngồi", là điều cần phải học tập.`
},

{
    id: 'Sk.71', title: 'Sekhiya 71', audio: '7Sk-71.mp3',
    text: `Na pacchato gacchanto purato gacchantassa agilānassa dhammaṃ desessāmīti sikkhā karaṇīyā. [5.3]
"Ta sẽ không đi phía sau thuyết Pháp cho người không bị bệnh đang đi phía trước", là điều cần phải học tập.`
},

{
    id: 'Sk.72', title: 'Sekhiya 72', audio: '7Sk-72.mp3',
    text: `Na uppathena gacchanto pathena gacchantassa agilānassa dhammaṃ desessāmīti sikkhā karaṇīyā. [5.3]
"Ta sẽ không đi ngoài đường thuyết Pháp cho người không bị bệnh đang đi trên đường", là điều cần phải học tập.`
},

{
    id: 'Sk.73', title: 'Sekhiya 73', audio: '7Sk-73.mp3',
    text: `Na ṭhito agilāno uccāraṃ vā passāvaṃ vā karissāmīti sikkhā karaṇīyā. [5.1]
"Ta không bị bệnh thì sẽ không đứng mà đại tiện hay tiểu tiện", là điều cần phải học tập.`
},

{
    id: 'Sk.74', title: 'Sekhiya 74', audio: '7Sk-74.mp3',
    text: `Na harite agilāno uccāraṃ vā passāvaṃ vā kheḷaṃ vā karissāmīti sikkhā karaṇīyā. [5.5]
"Ta không bị bệnh thì sẽ không đại tiện, tiểu tiện hay khạc nhổ trên cỏ xanh", là điều cần phải học tập.`
},

{
    id: 'Sk.75', title: 'Sekhiya 75', audio: '7Sk-75.mp3',
    text: `Na udake agilāno uccāraṃ vā passāvaṃ vā kheḷaṃ vā karissāmīti sikkhā karaṇīyā. [4.9]
"Ta không bị bệnh thì sẽ không đại tiện, tiểu tiện hay khạc nhổ vào trong nước", là điều cần phải học tập.
Pādukavaggo sattamo. [2.8]
Chương Đôi Guốc là chương thứ bảy.`
},

{
    id: 'Sk.U', title: 'Sekhiya Uddiṭṭhā', audio: '7Sk-U.mp3',
    text: `Uddiṭṭhā kho āyasmanto sekhiyā dhammā. Tatthāyasmante pucchāmi, kaccittha parisuddhā, [5.3]
Này các đại đức, các Ưng Học Pháp đã được tụng đọc xong. Trong phần này tôi xin hỏi các đại đức: Các đại đức có trong sạch không?
dutiyampi pucchāmi, kaccittha parisuddhā, tatiyampi pucchāmi, kaccittha parisuddhā, [3.85]
Tôi xin hỏi lần thứ nhì: Các đại đức có trong sạch không? Tôi xin hỏi lần thứ ba: Các đại đức có trong sạch không?
parisuddhetthāyasmanto, tasmā tuṇhī, evametaṃ dhārayāmīti. Sekhiyā Niṭṭhitā. [6.1]
Các đại đức trong sạch, do đó mới im lặng. Tôi xin ghi nhận sự việc như vậy. Các Ưng Học Pháp đã kết thúc.`
},


 
{
    id: 'As', title: 'Adhikaraṇa-samatha', audio: '8As.mp3',
    text: `Ime kho panāyasmanto satta adhikaraṇasamathā Dhammā uddesaṃ āgacchanti. [5.0]
Này các đại đức, đây là bảy pháp Diệt Tranh được tụng đọc đến.
Uppannupannānaṃ adhikaraṇānaṃ samathāya vūpasamāya: Sammukhāvinayo dātabbo, Sativinayo dātabbo, [5.9]
Để dàn xếp và dập tắt các vụ tranh chấp phát sinh: Pháp hành xử Luật với sự hiện diện nên được thực hiện, pháp hành xử Luật bằng nhớ lại nên được thực hiện,
Amūḷhavinayo dātabbo, Paṭiññāya kāretabbaṃ, Yebhuyyasikā, Tassapāpiyyasikā, Tiṇavatthārako’ti. [6.9]
pháp hành xử Luật khi không điên cuồng nên được thực hiện, pháp nên xử lý theo sự tự thú, xử lý theo đa số, xử lý theo tội trạng của người đó, và pháp trải cỏ che lấp.`
},

{
    id: 'As.U', title: 'Adhikaraṇa-samatha Uddiṭṭhā', audio: '8As-U.mp3',
    text: `Uddiṭṭhā kho āyasmanto satta adhikaraṇasamathā dhammā. Tatthāyasmante, pucchāmi kaccittha parisuddhā, [5.6]
Này các đại đức, bảy pháp Diệt Tranh đã được tụng đọc xong. Trong phần này tôi xin hỏi các đại đức: Các đại đức có trong sạch không?
dutiyampi pucchāmi, kaccittha parisuddhā, tatiyampi pucchāmi, kaccittha parisuddhā, [3.95]
Tôi xin hỏi lần thứ nhì: Các đại đức có trong sạch không? Tôi xin hỏi lần thứ ba: Các đại đức có trong sạch không?
parisuddhetthāyasmanto, tasmā tuṇhī, evametaṃ dhārayāmīti. [4.5]
Các đại đức trong sạch, do đó mới im lặng. Tôi xin ghi nhận sự việc như vậy.
Adhikaraṇasamathā Niṭṭhitā. [2.6]
Các pháp Diệt Tranh đã kết thúc.`
},

{
    id: 'Niṭṭhita', title: 'Niṭṭhita', audio: '9-Nitthita.mp3',
    text: `Uddiṭṭhaṃ kho āyasmanto nidānaṃ, Uddiṭṭhā cattāro pārājikā dhammā, Uddiṭṭhā terasa saṅghādisesā dhammā, Uddiṭṭhā dve aniyatā dhammā, [8.8]
Này các đại đức, phần Duyên Khởi đã được tụng xong. Bốn pháp Bất Cộng Trụ đã được tụng xong. Mười ba pháp Tăng Tàn đã được tụng xong. Hai pháp Bất Định đã được tụng xong.
Uddiṭṭhā tiṃsa nissaggiyā pācittiyā dhammā, Uddiṭṭhā dvenavuti pācittiyā dhammā, [5.1]
Ba mươi pháp Ưng Xả Đối Trị đã được tụng xong. Chín mươi hai pháp Ưng Đối Trị đã được tụng xong.
Uddiṭṭhā cattāro pāṭidesanīyā dhammā, Uddiṭṭhā sekhiyā dhammā, [4.3]
Bốn pháp Ưng Phát Lộ đã được tụng xong. Các Ưng Học Pháp đã được tụng xong.
Uddiṭṭhā satta adhikaraṇasamathā dhammā, [2.6]
Bảy pháp Diệt Tranh đã được tụng xong.
ettakaṃ tassa bhagavato suttāgataṃ suttapariyāpannaṃ anvaddhamāsaṃ uddesaṃ āgacchati, [5.3]
Bấy nhiêu pháp của Đức Thế Tôn ấy đã được truyền lại trong Kinh, nằm trong phạm vi của Kinh, và được tụng đọc mỗi nửa tháng.
tattha sabbeheva samaggehi sammodamānehi avivadamānehi sikkhitabbanti. [4.9]
Trong các pháp ấy, tất cả chúng ta phải cùng nhau hòa hợp, hoan hỷ, không tranh cãi mà cùng học tập.
Bhikkhupātimokkhaṃ Niṭṭhitaṃ. [3.6]
Dứt Giới Bổn Pātimokkha Của Tỳ Khưu.`
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
    // --- INIT ---
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
		const savedVietState = localStorage.getItem('vietnameseEnabled');
        const vietBtn = document.getElementById('btn-viet-toggle');
        // If it is 'true' OR null (first time user), turn it ON
        if (savedVietState === 'true' || savedVietState === null) {
            displayArea.classList.add('show-translation');
            if (vietBtn) vietBtn.classList.add('btn-viet-active');
        } else {
            displayArea.classList.remove('show-translation');
            if (vietBtn) vietBtn.classList.remove('btn-viet-active');
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
   
   audioPlayer.addEventListener('volumechange', () => {
    // Save the current volume (0.0 to 1.0) to localStorage
    localStorage.setItem('savedAudioVolume', audioPlayer.volume);
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
// --- ADD THIS NEW CODE ---
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
    allLines = []; // Reset recitation lines array
    
    // Split text by new line
    const lines = rawText.split('\n');
    
    let cumulativeStartTimeMs = 0;
    const overrideIntervalMs = localStorage.getItem('overrideInterval') ? parseFloat(localStorage.getItem('overrideInterval')) * 1000 : null;

    lines.forEach(line => {
        let cleanLine = line.trim();
        if (cleanLine === '') return;

        // Check if this line is Pali (Recitation line) by looking for time marker [x.x]
        const timeMatch = cleanLine.match(/\s*\[(\d+(\.\d+)?)\]\s*$/);

        if (timeMatch) {
            // === IS PALI LINE ===
            let customDuration = parseFloat(timeMatch[1]) * 1000;
            cleanLine = cleanLine.replace(timeMatch[0], ''); // Remove time marker for display

            const lineDiv = document.createElement('div');
            lineDiv.className = 'line-break';
            
            // Logic for duration (Original vs Override)
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
                // Click to reveal hidden words logic
                span.onclick = function() {
                    if (this.classList.contains('hidden')) {
                        this.classList.remove('hidden');
                        this.classList.add('revealed');
                    }
                };
                lineDiv.appendChild(span);
            });

            displayArea.appendChild(lineDiv);
            allLines.push(lineDiv); // Add ONLY Pali lines to the recitation array

        } else {
            // === IS TRANSLATION LINE (No time marker) ===
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
function toggleVietnamese() {
    displayArea.classList.toggle('show-translation');
    const btn = document.getElementById('btn-viet-toggle');
    const isEnabled = displayArea.classList.contains('show-translation');
    
    if (isEnabled) {
        btn.classList.add('btn-viet-active');
    } else {
        btn.classList.remove('btn-viet-active');
    }

    // Save state to LocalStorage
    localStorage.setItem('vietnameseEnabled', isEnabled);
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
    const newGoal = prompt("Nhập mục tiêu hằng ngày của bạn:", currentGoal);
    
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
                "Ôn Tập & Kiểm Tra", 
                `${levelInfo.icon} Mức độ thông thuộc: Cấp&nbsp;độ&nbsp;${levelInfo.level}&nbsp;(${currentXP}&nbsp;XP)`, 
                "Ôn tập lại"
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
                "Chúc mừng bạn đã thuộc 100% các câu!", 
                "Vượt qua bài kiểm tra tổng hợp để nhận Chứng Nhận.", 
                "Bắt đầu kiểm tra"
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
            bannerTitle.innerHTML = '<i class="fas fa-wreath-laurel"></i> Hộ Trì Giới Luật <i class="fas fa-wreath-laurel"></i>';
            bannerSubtitle.innerHTML = 'Chứng Nhận Thành Tựu Học Thuộc Lòng Giới&nbsp;Bổn&nbsp;Pātimokkha';
             showGrandAchievement();
        } else {
            bannerTitle.innerHTML = '<i class="fas fa-wreath-laurel"></i> Hộ Trì Học Giới <i class="fas fa-wreath-laurel"></i>';
            bannerSubtitle.innerHTML = 'Chứng Nhận Thành Tựu Học Thuộc Lòng Học&nbsp;Giới&nbsp;Này';
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
        alert("Đang tải thư viện biểu đồ...");
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
    document.getElementById('weekly-report-title').innerText = `Tuần (${statsCurrentWeekStart.toLocaleDateString('vi-VN', {month:'numeric', day:'numeric'})} - ${weekEndDisp.toLocaleDateString('vi-VN', {month:'numeric', day:'numeric'})})`;

    const weeklyLabels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    
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
    document.getElementById('monthly-report-title').innerText = `Tháng ${new Date(mYear, mMonth).toLocaleDateString('vi-VN', { month: 'numeric', year: 'numeric' })}`;
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
                title: { display: sectionData.length === 0, text: 'Chưa có dữ liệu', position: 'bottom', color: '#6b7280' },
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
            datasets: weeklyDatasets.length > 0 ? weeklyDatasets : [{ label: 'Chưa có dữ liệu', data: new Array(7).fill(0), backgroundColor: '#374151' }]
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
                            const dayName = index === 6 ? 'CN' : `T${index + 2}`;
                            return `${dayName} (${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')})`;
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
            datasets: monthlyDatasets.length > 0 ? monthlyDatasets : [{ label: 'Chưa có dữ liệu', data: new Array(daysInMonth).fill(0), backgroundColor: '#374151' }]
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
        <h4 id="exam-title" style="margin-top:0; color:#b35900">Chúc mừng bạn đã thuộc 100% các câu!</h4>
        <p id="exam-desc">Vượt qua bài kiểm tra tổng hợp để nhận Chứng Nhận.</p>
        <button id="exam-btn" class="btn-primary" onclick="startSectionExam()">Bắt đầu</button>
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
    let titleText = "Kiểm Tra Tổng Hợp";
    if (selectedLoopIndices.size > 0) {
        titleText = `Ôn Tập (${selectedLoopIndices.size} câu chọn)`;
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
    alert("Sādhu! Bạn đã hoàn thành xuất sắc học giới này.");
}
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
        textSpan.innerText = "Đã thuộc"; 

        label.appendChild(input);
        label.appendChild(textSpan);
        container.appendChild(label);

        // 2. NEW: Practice Button Section
        const practiceBtn = document.createElement('button');
        practiceBtn.className = 'btn-practice';
        practiceBtn.innerHTML = '<i class="fas fa-bullseye-arrow"></i> Luyện Tập';
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
                return { pali: paliText, trans: "(Không có bản dịch)" };
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
        document.getElementById('quiz-title').innerText = `Luyện Tập (${sortedIndices.length} câu chọn)`;

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
            document.getElementById('quiz-title').innerText = "Kiểm Tra Học Thuộc";
        } else if (mode === 'practice') {
            document.getElementById('quiz-title').innerText = "Luyện Tập";
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
    document.getElementById('quiz-progress').innerText = `Câu ${currentQuizIndex + 1}/${total}`;
    document.getElementById('btn-quiz-next').disabled = true;
    document.getElementById('btn-quiz-next').innerText = (currentQuizIndex === total - 1) ? "Hoàn thành" : "Tiếp tục";
    document.getElementById('btn-quiz-reset').style.display = 'none';

    const sentenceArea = document.getElementById('quiz-sentence-area');
    const optionsArea = document.getElementById('quiz-options-area');
    const instructionText = document.getElementById('quiz-instruction-text'); // Target the instruction
    
    sentenceArea.innerHTML = '';
    optionsArea.innerHTML = '';

    // === NẾU LÀ CÂU HỎI TRẮC NGHIỆM TIẾNG VIỆT ===
    if (data.type === 'translation') {
        
        // Cập nhật câu hướng dẫn
        if (instructionText) instructionText.innerText = "Ý nghĩa Tiếng Việt của câu Pali này?";
        
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
        if (instructionText) instructionText.innerText = "Chọn từ bên dưới để điền vào chỗ trống:";

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
        alert(`Luyện tập hoàn thành! Bạn nhận được +${quizQueue.length} XP.`);
   

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