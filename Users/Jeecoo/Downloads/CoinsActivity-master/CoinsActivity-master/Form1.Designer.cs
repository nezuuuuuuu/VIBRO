namespace CoinsActivity
{
    partial class Form1
    {
        /// <summary>
        ///  Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        ///  Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        ///  Required method for Designer support - do not modify
        ///  the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            openFileDialog1 = new OpenFileDialog();
            saveFileDialog1 = new SaveFileDialog();
            pictureBox1 = new PictureBox();
            pictureBox2 = new PictureBox();
            button1 = new Button();
            label1 = new Label();
            label2 = new Label();
            label3 = new Label();
            label4 = new Label();
            ((System.ComponentModel.ISupportInitialize)pictureBox1).BeginInit();
            ((System.ComponentModel.ISupportInitialize)pictureBox2).BeginInit();
            SuspendLayout();
            // 
            // openFileDialog1
            // 
            openFileDialog1.FileName = "openFileDialog1";
            openFileDialog1.FileOk += openFileDialog1_FileOk;
            // 
            // pictureBox1
            // 
            pictureBox1.BorderStyle = BorderStyle.FixedSingle;
            pictureBox1.Location = new Point(22, 121);
            pictureBox1.Name = "pictureBox1";
            pictureBox1.Size = new Size(547, 472);
            pictureBox1.SizeMode = PictureBoxSizeMode.StretchImage;
            pictureBox1.TabIndex = 1;
            pictureBox1.TabStop = false;
            pictureBox1.Click += pictureBox1_Click;
            // 
            // pictureBox2
            // 
            pictureBox2.BorderStyle = BorderStyle.FixedSingle;
            pictureBox2.Location = new Point(638, 121);
            pictureBox2.Name = "pictureBox2";
            pictureBox2.Size = new Size(547, 472);
            pictureBox2.SizeMode = PictureBoxSizeMode.StretchImage;
            pictureBox2.TabIndex = 2;
            pictureBox2.TabStop = false;
            // 
            // button1
            // 
            button1.Location = new Point(22, 32);
            button1.Name = "button1";
            button1.Size = new Size(547, 46);
            button1.TabIndex = 3;
            button1.Text = "Process";
            button1.UseVisualStyleBackColor = true;
            button1.Click += button1_Click;
            // 
            // label1
            // 
            label1.AutoSize = true;
            label1.Location = new Point(638, 32);
            label1.Name = "label1";
            label1.Size = new Size(85, 20);
            label1.TabIndex = 4;
            label1.Text = "Coin Count:";
            label1.Click += label1_Click;
            // 
            // label2
            // 
            label2.AutoSize = true;
            label2.Location = new Point(729, 32);
            label2.Name = "label2";
            label2.Size = new Size(17, 20);
            label2.TabIndex = 5;
            label2.Text = "0";
            label2.Click += label2_Click;
            // 
            // label3
            // 
            label3.AutoSize = true;
            label3.Location = new Point(638, 58);
            label3.Name = "label3";
            label3.Size = new Size(182, 20);
            label3.TabIndex = 6;
            label3.Text = "Coin Total Denomination: ";
            // 
            // label4
            // 
            label4.AutoSize = true;
            label4.Location = new Point(826, 58);
            label4.Name = "label4";
            label4.Size = new Size(17, 20);
            label4.TabIndex = 7;
            label4.Text = "0";
            label4.Click += label4_Click;
            // 
            // Form1
            // 
            AutoScaleDimensions = new SizeF(8F, 20F);
            AutoScaleMode = AutoScaleMode.Font;
            ClientSize = new Size(1214, 684);
            Controls.Add(label4);
            Controls.Add(label3);
            Controls.Add(label2);
            Controls.Add(label1);
            Controls.Add(button1);
            Controls.Add(pictureBox2);
            Controls.Add(pictureBox1);
            Name = "Form1";
            Text = "Form1";
            ((System.ComponentModel.ISupportInitialize)pictureBox1).EndInit();
            ((System.ComponentModel.ISupportInitialize)pictureBox2).EndInit();
            ResumeLayout(false);
            PerformLayout();
        }

        #endregion
        private OpenFileDialog openFileDialog1;
        private SaveFileDialog saveFileDialog1;
        private PictureBox pictureBox1;
        private PictureBox pictureBox2;
        private Button button1;
        private Label label1;
        private Label label2;
        private Label label3;
        private Label label4;
    }
}
