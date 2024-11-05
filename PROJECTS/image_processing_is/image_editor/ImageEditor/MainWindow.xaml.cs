using Microsoft.Win32;
using System;
using System.Drawing;
using System.IO;
using System.Windows;
using System.Windows.Media.Imaging;

namespace ImageEditor
{
    public partial class MainWindow : Window
    {
        private BitmapImage originalImage;

        public MainWindow()
        {
            InitializeComponent();
        }

        private void SelectImage_Click(object sender, RoutedEventArgs e)
        {
            OpenFileDialog openFileDialog = new OpenFileDialog
            {
                Filter = "Image files (*.jpg;*.jpeg;*.png)|*.jpg;*.jpeg;*.png|All files (*.*)|*.*"
            };
            if (openFileDialog.ShowDialog() == true)
            {
                originalImage = new BitmapImage(new Uri(openFileDialog.FileName));
                SelectedImage.Source = originalImage;
            }
        }

        private void Grayscale_Click(object sender, RoutedEventArgs e)
        {
            if (originalImage != null)
            {
                Bitmap bitmap = BitmapImageToBitmap(originalImage);
                Bitmap grayBitmap = MakeGrayscale(bitmap);
                SelectedImage.Source = BitmapToImageSource(grayBitmap);
            }
        }

        private void Original_Click(object sender, RoutedEventArgs e)
        {
            if (originalImage != null)
            {
                SelectedImage.Source = originalImage;
            }
        }

        private Bitmap BitmapImageToBitmap(BitmapImage bitmapImage)
        {
            using (MemoryStream outStream = new MemoryStream())
            {
                BitmapEncoder enc = new BmpBitmapEncoder();
                enc.Frames.Add(BitmapFrame.Create(bitmapImage));
                enc.Save(outStream);
                Bitmap bitmap = new Bitmap(outStream);
                return new Bitmap(bitmap);
            }
        }

        private Bitmap MakeGrayscale(Bitmap original)
        {
            for (int y = 0; y < original.Height; y++)
            {
                for (int x = 0; x < original.Width; x++)
                {
                    System.Drawing.Color originalColor = original.GetPixel(x, y);
                    int grayScale = (int)((originalColor.R * 0.3) + (originalColor.G * 0.59) + (originalColor.B * 0.11));
                    System.Drawing.Color grayColor = System.Drawing.Color.FromArgb(originalColor.A, grayScale, grayScale, grayScale);
                    original.SetPixel(x, y, grayColor);
                }
            }
            return original;
        }

        private BitmapImage BitmapToImageSource(Bitmap bitmap)
        {
            using (MemoryStream memory = new MemoryStream())
            {
                bitmap.Save(memory, System.Drawing.Imaging.ImageFormat.Bmp);
                memory.Position = 0;
                BitmapImage bitmapImage = new BitmapImage();
                bitmapImage.BeginInit();
                bitmapImage.StreamSource = memory;
                bitmapImage.CacheOption = BitmapCacheOption.OnLoad;
                bitmapImage.EndInit();
                return bitmapImage;
            }
        }
    }
}
