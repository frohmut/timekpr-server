<?php

/*
  Write as JSON-String (without validation) to a local file.
*/

$data = $_POST["json"];

$ok = file_put_contents('./timekpr-data.json', $data, LOCK_EX);

header('Content-Type: application/json');
if ($ok === FALSE) {
	echo '{ "error": "Could not update Database." }';
}
else {
	$txt = file_get_contents('./timekpr-data.json');
	echo $txt;
}
?>
