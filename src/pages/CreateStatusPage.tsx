
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Upload, Crop } from 'lucide-react';
import { Link } from 'react-router-dom';

const CreateStatusPage = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropImage = () => {
    // Simple mock crop - in real app, would use a proper cropping library
    setCroppedImage(selectedImage);
    alert('Image cropped! (This is a demo - real cropping would be implemented with a proper library)');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!croppedImage && !selectedImage) {
      alert('Please select an image first');
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('Status created with image:', croppedImage || selectedImage);
    
    setIsSubmitting(false);
    navigate('/dashboard');
  };

  return (
    <div className="flex flex-col min-h-screen bg-whatsapp-light">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6 max-w-md">
        <div className="mb-6">
          <Link to="/dashboard" className="flex items-center text-whatsapp-green font-medium">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Dashboard
          </Link>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Post Status Update</CardTitle>
            <p className="text-sm text-gray-600">Share an image with your followers</p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <Label>Status Image</Label>
                
                {!selectedImage ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 mb-4">Upload an image for your status</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('image-upload')?.click()}
                    >
                      Choose Image
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative">
                      <img 
                        src={croppedImage || selectedImage} 
                        alt="Status preview" 
                        className="w-full h-64 object-cover rounded-lg"
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        type="button"
                        variant="outline"
                        onClick={handleCropImage}
                        disabled={!!croppedImage}
                      >
                        <Crop className="w-4 h-4 mr-2" />
                        {croppedImage ? 'Cropped' : 'Crop Image'}
                      </Button>
                      
                      <Button 
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setSelectedImage(null);
                          setCroppedImage(null);
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-yellow-50 p-3 rounded-lg">
                <p className="text-sm text-yellow-800">
                  📝 Status updates expire after 24 hours and only support images.
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-whatsapp-green hover:bg-whatsapp-green/90"
                disabled={isSubmitting || (!selectedImage && !croppedImage)}
              >
                {isSubmitting ? 'Posting...' : 'Post Status'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CreateStatusPage;
