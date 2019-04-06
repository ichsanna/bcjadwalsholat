const express = require('express');
const xlstojson = require("convert-excel-to-json");
const multer = require('multer');
const fs = require('fs');
const hijrahdate = require('hijrah-date');
const router = express.Router();
var output,date,hijrahDate;
var namahari,hari,bulan,tahun; // Masehi
var harih,bulanh,tahunh; // Hijriah
var jumlah,stringtmp,stringout;

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

function parsetanggal(tgl) {
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
router.get('/', function (req, res, next) {
	res.render('index');
});
router.get('/hasil', function (req, res, next) {
	jumlah = output["JADWAL SHALAT"].length; // Jumlah hari dalam 1 bulan
	stringtmp;
	stringout = "<br>";
	for (var i = 6; i < jumlah; i++) { // Index pertama waktu sholat = 6
		// Format pesan Broadcast
		parsetanggal(output['JADWAL SHALAT'][i]["B"]);
		stringtmp = "━━━━ بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ ━━━━<br>";
		stringtmp += "Berikut jadwal shalat wilayah Yogyakarta dan sekitarnya untuk hari " + namahari+", "+hari+" "+bulan+" "+tahun+ " / "+harih+" "+bulanh+" "+tahunh+"H <br><br>";
		//stringtmp+="Imsak: "+output['JADWAL SHALAT'][i]["D"]+"<br>";
		stringtmp += "Subuh: " + output['JADWAL SHALAT'][i]["E"] + "<br>";
		stringtmp += "Terbit: " + output['JADWAL SHALAT'][i]["F"] + "<br>";
		stringtmp += "Dhuha: " + output['JADWAL SHALAT'][i]["G"] + "<br>";
		stringtmp += "Dzuhur: " + output['JADWAL SHALAT'][i]["H"] + "<br>";
		stringtmp += "Ashar: " + output['JADWAL SHALAT'][i]["I"] + "<br>";
		stringtmp += "Maghrib: " + output['JADWAL SHALAT'][i]["J"] + "<br>";
		stringtmp += "Isya': " + output['JADWAL SHALAT'][i]["K"] + "<br><br>";
		stringtmp += "\"Seorang mukmin dengan mukmin yang lain ibarat bangunan yang saling menguatkan antara satu dengan yang lain.\" (H.R. Bukhari)<br><br>"
		stringtmp += "Sumber : bimasislam.kemenag.go.id<br><br><br>"
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