<h2>Hello! Welcome to</h2> 
<h1>Pure Javascript Geotagging tool</h1>
<p>You are able to check the position of your geotagged images. Simply drag the images to the map and they will be positioned on the place they were shooted. You can drop several images simultaneously. If your images do not have a geotag, you are able to position them on the map and save the image with position stored in the file.</p>
<p>Technical Notes:</p> 
<ul>
	<li>This tool uses HTML5 File API. It has been tested with browsers supporting this API. It works with latest versions of Firefox and Chrome browser. The script works only for positioning geotagged images for Opera and Safari 6.0 browsers. For Internet Explorer 10 I got files property of the dataTransfer object always undefined.</li>
 	<li>There is no presently a library for storing jpeg headers using javascript only and it cannot be made in 100 lines of code. That is why when you download the image with geotag it will contain only GPS data and all the other tags will be gone. So please do not overwrite your original files and wait for complete version of this tool which will fully support jpeg header modification!</li>
</ul>
<br /><br /><br /><br />