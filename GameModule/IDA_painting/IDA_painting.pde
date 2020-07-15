import processing.net.*; 
import java.util.List;
import java.io.FilenameFilter;
import java.io.File;

/* loading config.json ====================================================== */
JSONObject config;

/* Socket client (processing.net.*) ========================================= */
Client myClient;

/* File filter, avoid non-image files (java.io.FilenameFilter) ============== */
static final FilenameFilter IMAGE_FILTER = new FilenameFilter() {
  final String[] EXTS = {
    ".png", ".jpg", ".jpeg", ".gif"
  };
  @ Override boolean accept(final File fir, String name) {
    name = name.toLowerCase();
    for (final String ext: EXTS) if (name.endsWith(ext)) return true;
    return false;
  }
};

/* For weather paintings ==================================================== */
String weather_db_path;// = "weather_db.txt", from config file
final List<PImage> weather_images = new ArrayList<PImage>();
String[] weather_names;
int[] weather_num;
int[] weather_start;
int[] weather_end;
int name_weather = 0;
boolean weather_load_finish = false;
int forward_weather = 0; 
PImage weather_img_displaying;
PImage pre_weather_img_displaying = null;

/* For portrait paintings =================================================== */
String portrait_db_path;
final List<PImage> portrait_images = new ArrayList<PImage>();
final List<PImage> async_portrait_images = new ArrayList<PImage>();
final List<Boolean> async_portrait_boolean_flag = new ArrayList<Boolean>();
String[] answerPath;
int portrait_end_index;
int async_portrait_cnt;
boolean portrait_load_finish = false;
int forward = 0; 
float timer_e = 0, time_e = 0.1; // sec
float timer_q = 0, time_q = 0.8; // sec
float timer_b = 0, time_b = 0.65;  // sec

/* For display ============================================================== */
char caselabel = 'I';
PImage img_displaying;
PImage pre_img_displaying = null;
// Guess game main page
PFont FontPlay;
int margin_B = int(width / 8);
int color_play = 1;
// QRcode
String qr_path;// = "data/qrcode.png";
PImage QRimg = null;  // QR code image
int QRheight, QRmargin;// QRcode region height
// percentage string
String percentage = "0";
int truely_End_flag = 0;

// Load single portrait
void loadSinglePortrait(String[] answerPath) {
  portrait_load_finish = false;
  // remove cache
  for(int i = 0; i < portrait_images.size(); i++){
    g.removeCache(portrait_images.get(i));
  }
  System.gc();
  
  portrait_images.clear();
  loadSinglePortraitImages(portrait_db_path, answerPath);
  println("load picture done");
  myClient.write("load:finish");
  portrait_load_finish = true;
}

// Load single portrait paintings
void loadSinglePortraitImages(String path, String[] answerPath) {
  async_portrait_boolean_flag.clear();
  async_portrait_cnt = -1;
  for(int i = 0; i < answerPath.length; i++) {
    String fname = path + "/" + answerPath[i];
    portrait_images.add(requestImage(fname));
    async_portrait_boolean_flag.add(false);
  }
  println(async_portrait_cnt);
  println(portrait_end_index);

  int timer = millis();
  while(async_portrait_cnt != portrait_end_index){
    for(int i = 0; i < answerPath.length; i++) {
      if((portrait_images.get(i).width > 0) && (async_portrait_boolean_flag.get(i) == false)){
        println("load ", answerPath[i], "done");
        async_portrait_cnt = async_portrait_cnt + 1;
        
        // add loading percentage
        // modified 2019/9/7
        percentage = str(round(100 * async_portrait_cnt / answerPath.length));
        println(percentage);
        myClient.write("load:" + percentage);

        async_portrait_boolean_flag.set(i, true);
        PImage img = portrait_images.get(i);
        img.resize(int(width*0.8), int(height*0.8));
        
        // modified 2019/9/7
        if(i == portrait_end_index){
          percentage = str(round(100 * (async_portrait_cnt + 1) / answerPath.length));
          println(percentage);
          myClient.write("load:" + percentage);
        }
      }
    }
    if(millis() - timer > 20000){
      break;
    }
  }
  println("portrait loading done");
}

/* Setup ==================================================================== */
void setup() { 
  // fullScreen(P2D);
  size(540, 960, P2D);
  //size(378, 672, P2D);

  noCursor();
  
  // load config.json
   config = loadJSONObject("config.json");
   weather_db_path = config.getString("weather_db_path");
   portrait_db_path = config.getString("portrait_db_path");
   qr_path = config.getString("qr_path");
  
  // guess game main page setup
  FontPlay = loadFont("SansSerif.bold-60.vlw");
    
  // open client, link to server
  myClient = new Client(this, "127.0.0.1", 8000); 
    
  // Load weather paintings ===================================  
  println("loading weather");
  thread("loadWeatherImageThread");
  
  // Load portrait paintings ==================================
  println("loading portrait");
  portrait_load_finish = true;
  
  // Set QR code
  QRheight = height / 6;  // QRcode region height (QRcode)
  QRmargin = int(0.05 * (float)QRheight);
  LoadQR();
}

void draw() {
  // Client part: receive data from server, store in data_all =============
  if (myClient.available() > 0 && weather_load_finish && portrait_load_finish) {
    String data_buffer = myClient.readStringUntil(';');
    println("Message from DAI : ", data_buffer);
    
    if (data_buffer != null) {
      String[] data_split = splitTokens(data_buffer, ",;");
      
      if (match(data_split[0], "w") != null) {
        name_weather = int(data_split[1]);
        println("name_weather = ", name_weather);
        pre_weather_img_displaying = null;
        
      } else if (match(data_split[0], "s") != null) {
        caselabel = 'S';
        println("recvdata S");
        
      } else if (match(data_split[0], "g") != null) {
        caselabel = 'G';
        println("recvdata G");
        
      } else if (match(data_split[0], "m") != null) {
        caselabel = 'M';
        println("recvdata M");
        
      } else if (match(data_split[0], "p") != null) {
        println("get portrait path");
        
        answerPath = new String[data_split.length - 1];
        for(int i = 1; i < data_split.length; i++){
          answerPath[i-1] = data_split[i];
        }
        printArray(answerPath);
        // set portrait_end
        portrait_end_index = answerPath.length - 1;
        println(portrait_end_index);
        
        forward = -1;
        // go to state "L" for loading
        caselabel = 'L';
             
      } else if (match(data_split[0], "f") != null) {
        forward += 1;
        println("recvdata foward+1 :", forward);
        
      } else if (match(data_split[0], "e") != null) {
        caselabel = 'E';
        println("recvdata E");
        
      } else if (match(data_split[0], "q") != null) { 
        // exit guess game, return weather mode
        LoadQR();
        caselabel = 'Q';
        pre_img_displaying = null;
        println("recvdata Q");
      }
    }
  }
  
  // Displaying ==================================================
  background(0);
  
  switch(caselabel) {
    // ************** case I: Frame initialization ****************************  
    case 'I':
      background(0);
      noStroke();
      fill(map(frameCount%70+1, 1, 69, 180, 10));
      ellipse(width/2, height/2, (frameCount%70+1)*10, (frameCount%70+1)*10);
      textAlign(CENTER, CENTER);
      textSize(50);
      textFont(FontPlay);
      fill(255);
      text("Loading data ... ", width/2, height/2);      
      if (weather_load_finish && portrait_load_finish) caselabel = 'W';
      break;    

    // ************** case W: Display Weather *****************************
    case 'W':
     try{
        if(forward_weather > weather_num[name_weather] - 1){
          forward_weather = 0;
        }
        
        if(pre_weather_img_displaying != null){
          image(pre_weather_img_displaying, (width - pre_weather_img_displaying.width) / 2, ( height - pre_weather_img_displaying.height) / 2);
        }
        else{
          weather_img_displaying = weather_images.get(weather_start[name_weather] + forward_weather);
          image(weather_img_displaying, (width - weather_img_displaying.width) / 2, ( height - weather_img_displaying.height) / 2);
          pre_weather_img_displaying = weather_img_displaying;
        }
     } catch (Exception e) {
       println("case W failed");
     }
     //show QR code
     if ( QRimg.width > 0) {
       image(QRimg, width - QRimg.width - QRmargin, height - QRimg.height - QRmargin);
     }
     break;
    
    // ************** case B: Mode(Start) Page ****************************
    case 'S':
      background(0, 0, 0);
      fill(246, 224, 183);
      rect(margin_B, margin_B, width - 2 * margin_B, height - 2 * margin_B, 30, 30, 30, 30);
      
      if (timer_b < time_b) {
        color_play = 0;
      } else if (timer_b >= time_b && timer_b < 2*time_b) {
        color_play = 1;
      } else {
        timer_b = 0;
      }
      timer_b += 1/frameRate;
      
      if (color_play == 0) {
        fill(96, 192, 220);
        color_play = 1;
      } else {
        fill(46, 154, 186);
        color_play = 0;
      }
      noStroke();
      rect(width/3 - width/6, height/2 - width/16, width*4/6, width/8, 30, 30, 30, 30);
      fill(255, 255, 255);
      textAlign(CENTER, CENTER);
      textFont(FontPlay);
      textSize(45);
      text("Choose a Mode", width/2, height/2);
      break;

    // ************** case G: Group Page ****************************
    case 'G':
      background(0, 0, 0);
      fill(246, 224, 183);
      rect(margin_B, margin_B, width - 2 * margin_B, height - 2 * margin_B, 30, 30, 30, 30);
      
      if (timer_b < time_b) {
        color_play = 0;
      } else if (timer_b >= time_b && timer_b < 2*time_b) {
        color_play = 1;
      } else {
        timer_b = 0;
      }
      timer_b += 1/frameRate;
      
      if (color_play == 0) {
        fill(90, 98, 104);
        color_play = 1;
      } else {
        fill(63, 71, 76);
        color_play = 0;
      }
      noStroke();
      rect(width/3 - width/6, height/2 - width/16, width*4/6, width/8, 30, 30, 30, 30);
      fill(255, 255, 255);
      textAlign(CENTER, CENTER);
      textFont(FontPlay);
      textSize(45);
      text("Choose a Group", width/2, height/2);
      break;
      
    // ************** case M: Member Page ****************************
    case 'M':
      background(0, 0, 0);
      fill(246, 224, 183);
      rect(margin_B, margin_B, width - 2 * margin_B, height - 2 * margin_B, 30, 30, 30, 30);
      
      if (timer_b < time_b) {
        color_play = 0;
      } else if (timer_b >= time_b && timer_b < 2*time_b) {
        color_play = 1;
      } else {
        timer_b = 0;
      }
      timer_b += 1/frameRate;
      
      if (color_play == 0) {
        fill(220, 53, 69);
        color_play = 1;
      } else {
        fill(247, 96, 109);
        color_play = 0;
      }
      noStroke();
      rect(width/3 - width/6, height/2 - width/16, width*4/6, width/8, 30, 30, 30, 30);
      fill(255, 255, 255);
      textAlign(CENTER, CENTER);
      textFont(FontPlay);
      textSize(40);
      text("Choose a Member", width/2, height/2);
      break;
      
    // ************** case L: Loading portrait ****************************  
    case 'L':
      if(forward == -1){
        portrait_load_finish = false;
        percentage = "0";
        thread("loadPortraitImageThread");
        forward = 0;
      }

      background(0);
      noStroke();
      fill(map(frameCount%70+1, 1, 69, 180, 10));
      ellipse(width/2, height/2, (frameCount%70+1)*10, (frameCount%70+1)*10);
      textAlign(CENTER, CENTER);
      textSize(50);
      textFont(FontPlay);
      fill(255);
      text("Loading data ... " + percentage + "%" , width/2, height/2);

      if(portrait_load_finish) caselabel = 'P';
      break;

    // ************** case P: Display portrait ****************************
    case 'P':
      try {
        if(portrait_load_finish){
          if(forward > portrait_end_index){
            if(pre_img_displaying != null){
              image(pre_img_displaying, (width - pre_img_displaying.width) / 2, ( height - pre_img_displaying.height) / 2);
            }
            break;
          }

          if(portrait_images.size() > 0){
            truely_End_flag = 0;
            
            img_displaying = portrait_images.get(forward);
            if(img_displaying != null){
              image(img_displaying, (width - img_displaying.width) / 2, ( height - img_displaying.height) / 2);
              pre_img_displaying = img_displaying;
            }
            else{
              if(pre_img_displaying != null){
                image(pre_img_displaying, (width - pre_img_displaying.width) / 2, ( height - pre_img_displaying.height) / 2);
              }
              forward += 1;
            }
          }
        }
        
      } catch (Exception e) {
        println(e);
        println("case P failed");
      }
      break;
      
    // ************** case E: End portrait ****************************
    case 'E':
      if (forward < portrait_end_index) {
        if (timer_e >= time_e) {
          forward += 1;
          timer_e = 0;
        } else {
          timer_e += 1/frameRate;
        }
      } else {
        caselabel = 'P';
        timer_e = 0;
      }
      try {
        if(portrait_images.size() > 0 && forward <= portrait_end_index){
          img_displaying = portrait_images.get(forward);
          if(img_displaying != null){
            image(img_displaying, (width - img_displaying.width) / 2, ( height - img_displaying.height) / 2);
            pre_img_displaying = img_displaying;
          }
          else if(pre_img_displaying != null){
            image(pre_img_displaying, (width - pre_img_displaying.width) / 2, ( height - pre_img_displaying.height) / 2);
          }
        }
        if(forward >= portrait_end_index && truely_End_flag == 0){
          truely_End_flag = 1;
        }
        if(truely_End_flag == 1){
          truely_End_flag = 2;
          forward += 1;
          myClient.write("display:finish");
          println("display finish");
          println("E2 ", forward, portrait_end_index);
        }
      } catch (Exception e) {
        println("case E failed");
      }      
      break;    
      
    // ************** case Q: Quit Page **************************
    case 'Q':
      // release cache
      for(int i = 0; i < portrait_images.size(); i++){
        g.removeCache(portrait_images.get(i));
      }
      portrait_images.clear();
      System.gc();

      // show leave game message
      textAlign(CENTER, CENTER);
      textSize(60);
      textFont(FontPlay);
      fill(180);
      text("See you !", width/2, height/2);
      // tint portrait
      tint(255, map(timer_q, 0, time_q, 255, 0));
      noTint();
      timer_q += 1/frameRate;
      if (timer_q >= time_q) {        
        timer_q = 0;
        caselabel = 'W';
      }
      break;
      
  }
  //println("this draw done, now caselabel:", caselabel);
}

void LoadQR() {
  try{
    QRimg = loadImage(qr_path);        
    QRimg.resize((int)(QRheight - 2 * QRmargin), (int)(QRheight - 2 * QRmargin));
  } catch (Exception e) {
    println("QR code error");
  }
}

// Thread fro loading portrait images =================================================================
void loadPortraitImageThread() { 
  loadSinglePortrait(answerPath);
}

// Thread for loading all weather images ==============================================================
void loadWeatherImageThread() { 
  weather_names = loadStrings(weather_db_path);
  weather_num = new int[weather_names.length];
  weather_start = new int[weather_names.length];
  weather_end = new int[weather_names.length];
  println("there are " + weather_names.length + " weather paintings");
  int n_img = 0;
  for (int i = 0 ; i < weather_names.length; i++) {
    loadWeatherImages(dataFile("weather/"+weather_names[i]), dataPath("weather/"+weather_names[i]), weather_images);
    weather_num[i] = weather_images.size() - n_img;
    weather_start[i] = n_img;
    weather_end[i] = weather_images.size() - 1;
    n_img = weather_images.size();
    println("Loading :", weather_names[i], ", start : ", weather_start[i], " end : ", weather_end[i], " , num = ", weather_num[i]);
  }
  printArray(weather_names);
  println("number of total weather images: ", weather_images.size());
  weather_load_finish = true;
}

// Load all weather paintings, save all in images buffer
void loadWeatherImages(File dir, String path, List images) {
  File[] pics = dir.listFiles(IMAGE_FILTER);  //printArray(pics);
  int n_totalimages = pics.length;  // total number of images in a folder
 
 //images.clear();
  for (int i = 1; i <= n_totalimages; i++) {
    String fname = path + "/" + str(i) + ".jpg";
    PImage img = loadImage(fname);  

    img.resize(int(width), int(height));
    images.add(img);
  }
}
