<?php 

  header("Access-Control-Allow-Origin: *");

  if (!isset($_GET['json'])) {
	echo "{}";
	exit;
  }

  $filepath = $_GET['json'];
  $file = fopen($filepath, "r") or die("");
  $json = fread($file,filesize($filepath));
  fclose($file);

  echo $json;
  
?>