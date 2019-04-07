const express = require('express');
const fs = require('fs');
const hijrahdate = require('hijrah-date');
const multer = require('multer');
const router = express.Router();
const xlstojson = require("convert-excel-to-json");
var output,date,hijrahDate;
var namahari,hari,bulan,tahun; // Masehi
var harih,bulanh,tahunh; // Hijriah
var jumlah,stringtmp,stringout,quote,quotenumber;
var quotes=[
"\"Siapapun yang memulai aktivitas pada pagi hari, sesungguhnya ia telah menggunakan waktu paling berkah pada hari itu\" (HR. Tirmidzi)",
"\"Perbanyaklah mengingat kematian. Seorang hamba yang banyak mengingat mati maka Allah akan menghidupkan hatinya dan diringankan baginya akan sakitnya kematian.\" (HR. Ad Dailami)",
"\"Tidak kecewa orang yang istikharah, tidak menyesal orang yang bermusyawarah & tidak akan melarat orang yang hemat.\" (HR. Thabrani)",
"\"Dua mata yang diharamkan dari api neraka, yaitu mata yang menangis karena takut kepada Allah dan mata yang menjaga serta mengawasi islam dan umatnya dari (gangguan) kaum kafir.\" (HR. Bukhari)",
"\"Dua kalimat yang ringan diucapkan, tetapi berat dalam timbangan dan disukai oleh Allah Yang Maha Pengasih, yaitu : Subhanallah wabihamdih, Subhanallahil 'azhim.\" (HR. Muslim)",
"\"Bacalah Al-Qur'an karena dia akan datang pada hari Kiamat sebagai syafaat bagi pembacanya.\" (HR. Muslim)",
"\"Sesungguhnya Allah swt mengangkat derajat beberapa golongan manusia dengan kalam (Alquran) ini dan merendahkan derajat golongan lainnya.\" (HR. Bukhari dan Muslim)",
"\"Sesungguhnya shalat itu mencegah dari perbuatan-perbuatan keji dan mungkar.\" (QS. Al-Ankabut: 45)",
"\"Dan barangsiapa bertawakkal kepada Allah, niscaya Allah akan mencukupkan (keperluan)-nya, sesungguhnya Allah telah mengadakan ketentuan bagi tiap-tiap sesuatu\" (QS. At-Talaq: 3)",
"\"Sebaik-baik manusia adalah manusia yang paling besar mendatangkan manfaat (baik) bagi manusia yang lain.\" (HR. Thabrani)",
"\"Barangsiapa yang mengerjakan kebaikan sekecil apapun, niscaya dia akan melihat (balasan)nya.\" (QS. Al-Zalzalah: 7)",
"\"Maka sesungguhnya bersama kesulitan itu ada kemudahan. Sesungguhnya bersama kesulitan itu ada kemudahan.\" (QS. Al-Insyirah: 5-6)",
"\"Hai orang-orang yang beriman, mintalah pertolongan kepada Allah dengan sabar dan shalat. Sesungguhnya Allah beserta orang-orang yang sabar.\" (QS. Al-Baqarah: 153)",
"\"Barangsiapa yang berpegang teguh pada (agama) Allah, maka sungguh dia diberi petunjuk kepada jalan yang lurus.\" (QS. Ali Imran: 101)",
"\"Dan boleh jadi kamu membenci sesuatu tetapi ia baik bagimu, dan boleh jadi kamu menyukai sesuatu tetapi ia buruk bagimu, dan Allah mengetahui dan kamu tidak mengetahui.\" (QS. Al-Baqarah: 216)",
"\"Senyummu di depan saudaramu, adalah sedekah bagimu\" (HR. Tirmidzi)",
"\"Tidak ada sesuatu yang lebih besar pengaruhnya di sisi Allah Ta'ala selain doa.\" (HR. Tirmidzi)",
"\"Seorang mukmin dengan mukmin yang lain ibarat bangunan yang saling menguatkan antara satu dengan yang lain.\" (HR. Bukhari)",
"\"Allah tidak membebani seseorang melainkan sesuai dengan kesanggupannya.\" (QS. Al-Baqarah: 286)",
"\"Iman memiliki lebih dari enam puluh cabang, dan malu adalah bagian dari iman.\" (HR. Bukhari)",
"\"Kekayaan tidaklah diukur dengan banyaknya harta, namun kekayaan yang hakiki adalah kekayaan hati.\" (HR. Bukhari dan Muslim)",
"\"Barang siapa yang membaca surat Al Kahfi pada hari Jumat, dia akan disinari cahaya di antara dua Jumat.\" (HR. An Nasai dan Baihaqi)",
"\"Hai orang-orang yang beriman, diwajibkan atas kamu berpuasa sebagaimana diwajibkan atas orang-orang sebelum kamu agar kamu bertaqwa.\" (Q.S Al Baqarah : 183)",
"\"Malam Lailatul Qadar itu lebih baik dari seribu bulan, Pada malam itu turun malaikat-malaikat dan malaikat Jibril dengan izin Tuhannya untuk mengatur segala urusan, sejahteralah malam itu hingga terbit fajar.\" (Q.S Al-Qadr : 3-5)",
"\"Barangsiapa berpuasa Ramadhan kemudian berpuasa enam hari bulan Syawal, maka dia seperti berpuasa satu tahun penuh\" (H.R. Muslim)"]

// Multer storage buat upload file xls
var storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, 'uploads')
	},
	filename: function (req, file, cb) {
		cb(null, file.fieldname + '.xls')
	}
});
var upload = multer({ dest: './uploads/' });

// ----------------------- FUNCTIONS -----------------------
function getquote(){ // Buat quotes
	quotenumber = Math.floor(Math.random() * (quotes.length-5))
	quote=quotes[quotenumber];
	if (namahari=='Jumat') quote=quotes[21];
	if (bulanh=='Syawal') quote=quotes[24];
	else if (bulanh=='Ramadhan') {
		if (Number(harih)<20) quote=quotes[22];
		else quote=quotes[23];
	}
}
function parsetanggal(tgl) { // Buat parse tanggal
	// Tanggal Masehi, format: Day, DD/MM/YYYY
	namahari = tgl.substr(0,tgl.indexOf(','));
	hari = Number(tgl.substr(-10,2));
	bulan = tgl.substr(-7,2);
	tahun = tgl.substr(-4,4);
	// Tanggal Hijriah
	date = new Date(Number(tahun),Number(bulan),hari);
	date.setDate(date.getDate()-2);  // Setting akurasi dikurangi 2 hari
	hijrahDate = new hijrahdate(date);
	harih=hijrahDate.getDate().toString();
	bulanh=hijrahDate.getMonth().toString();
	tahunh=hijrahDate.getFullYear().toString();
	if (namahari=='Minggu') namahari='Ahad'; // Rename
	// Rename nomor bulan dengan nama bulan
	if (bulan=='01') bulan='Januari';
	else if (bulan=='02') bulan='Februari';
	else if (bulan=='03') bulan='Maret';
	else if (bulan=='04') bulan='April';
	else if (bulan=='05') bulan='Mei';
	else if (bulan=='06') bulan='Juni';
	else if (bulan=='07') bulan='Juli';
	else if (bulan=='08') bulan='Agustus';
	else if (bulan=='09') bulan='September';
	else if (bulan=='10') bulan='Oktober';
	else if (bulan=='11') bulan='November';
	else if (bulan=='12') bulan='Desember';
	// Rename nomor bulan hijriah dengan nama bulan hijriah
	if (bulanh=='1') bulanh='Muharram';
	else if (bulanh=='2') bulanh='Safar';
	else if (bulanh=='3') bulanh='Rabi\'ul Awal';
	else if (bulanh=='4') bulanh='Rabi\'ul Akhir';
	else if (bulanh=='5') bulanh='Jumadil Awal';
	else if (bulanh=='6') bulanh='Jumadil Akhir';
	else if (bulanh=='7') bulanh='Rajab';
	else if (bulanh=='8') bulanh='Sya\'ban';
	else if (bulanh=='9') bulanh='Ramadhan';
	else if (bulanh=='10') bulanh='Syawal';
	else if (bulanh=='11') bulanh='Dzulqaidah';
	else if (bulanh=='12') bulanh='Dzulhijjah';
}

// ----------------------- ROUTES -----------------------
router.get('/', function (req, res, next) {
	res.render('index');
});
router.get('/hasil', function (req, res, next) {
	jumlah = output["JADWAL SHALAT"].length; // Jumlah hari dalam 1 bulan
	stringout = "<br>";
	for (var i = 6; i < jumlah; i++) { // Index pertama waktu sholat = 6
		parsetanggal(output['JADWAL SHALAT'][i]["B"]);
		getquote();
		// Format pesan Broadcast
		stringtmp = "━━━━ بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ ━━━━<br>";
		stringtmp += "Berikut jadwal shalat wilayah Yogyakarta dan sekitarnya untuk hari " + namahari+", "+hari+" "+bulan+" "+tahun+ " / "+harih+" "+bulanh+" "+tahunh+"H <br><br>";
		if (bulanh=='Ramadhan') stringtmp+="Imsak: "+output['JADWAL SHALAT'][i]["D"]+"<br>";
		stringtmp += "Subuh: " + output['JADWAL SHALAT'][i]["E"] + "<br>";
		stringtmp += "Terbit: " + output['JADWAL SHALAT'][i]["F"] + "<br>";
		stringtmp += "Dhuha: " + output['JADWAL SHALAT'][i]["G"] + "<br>";
		stringtmp += "Dzuhur: " + output['JADWAL SHALAT'][i]["H"] + "<br>";
		stringtmp += "Ashar: " + output['JADWAL SHALAT'][i]["I"] + "<br>";
		stringtmp += "Maghrib: " + output['JADWAL SHALAT'][i]["J"] + "<br>";
		stringtmp += "Isya': " + output['JADWAL SHALAT'][i]["K"] + "<br><br>";
		stringtmp += quote+"<br><br>";
		stringtmp += "Sumber : bimasislam.kemenag.go.id<br><br><br>";
		stringout += stringtmp; // Hasil tiap hari ditambahkan ke hasil akhir
	}
	res.set('Content-Type', 'text/html'); // Output string jadi format html
	res.send("<div class=\"text\">" + stringout + "</div>");
});
router.post('/upload', upload.single('excelfile'), function (req, res, next) {
	output = xlstojson({ // Convert file xls ke format JSON
		sourceFile: req.file.destination + req.file.filename
	});
	try {
		fs.unlinkSync(req.file.path); // Hapus file yang telah diupload
	} catch (e) {
		console.log("Error Deleting File: " + e);
	}
	res.redirect('/hasil');
});

module.exports = router;