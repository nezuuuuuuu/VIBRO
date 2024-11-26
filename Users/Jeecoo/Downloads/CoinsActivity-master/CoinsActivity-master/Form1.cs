namespace CoinsActivity
{
    public partial class Form1 : Form
    {
        Bitmap loaded, processed;
        public Form1()
        {
            InitializeComponent();
            loaded = new Bitmap(@"C:\PROJECTS\CoinsActivity\image\GetImage.jpeg");
            pictureBox1.Image = loaded;
        }

        private void saveFileToolStripMenuItem_Click(object sender, EventArgs e)
        {
        }

        private void openFileDialog1_FileOk(object sender, System.ComponentModel.CancelEventArgs e)
        {
            loaded = new Bitmap(openFileDialog1.FileName);
            pictureBox1.Image = loaded;
        }

        private void openFileToolStripMenuItem_Click(object sender, EventArgs e)
        {
            openFileDialog1.ShowDialog();
        }

        private void button1_Click(object sender, EventArgs e)
        {
            if (loaded != null)
            {
                processed = new Bitmap(loaded.Width, loaded.Height);
                ImageProcess.DetectCoins(ref loaded, ref processed, ref label2, ref label4);
                pictureBox2.Image = processed;
            }
        }

        private void pictureBox1_Click(object sender, EventArgs e)
        {

        }

        private void label1_Click(object sender, EventArgs e)
        {

        }

        private void label2_Click(object sender, EventArgs e)
        {

        }

        private void label4_Click(object sender, EventArgs e)
        {

        }
    }
}
