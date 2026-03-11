import React, { useState } from 'react';
import { useGetSitemapQuery, useAddToSitemapMutation, useLazyGenerateSitemapQuery } from '../../../../services/seoApi';
import toast from 'react-hot-toast';

const SitemapGenerator: React.FC = () => {
  const { data, isLoading, refetch } = useGetSitemapQuery();
  const [addToSitemap, { isLoading: isAdding }] = useAddToSitemapMutation();
  const [generateSitemap, { data: sitemapXml, isLoading: isGenerating }] = useLazyGenerateSitemapQuery();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [priority, setPriority] = useState('0.5');
  const [changeFrequency, setChangeFrequency] = useState('weekly');

  const urls = data?.data || [];

  const handleAddUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addToSitemap({
        url: newUrl,
        priority: parseFloat(priority),
        change_frequency: changeFrequency as any,
      }).unwrap();
      toast.success('URL added to sitemap');
      setShowAddForm(false);
      setNewUrl('');
      refetch();
    } catch {
      toast.error('Failed to add URL');
    }
  };

  const handleGenerateSitemap = async () => {
    try {
      await generateSitemap();
      toast.success('Sitemap generated successfully');
    } catch {
      toast.error('Failed to generate sitemap');
    }
  };

  const handleDownloadSitemap = () => {
    if (!sitemapXml) return;
    
    const blob = new Blob([sitemapXml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sitemap.xml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex space-x-3">
        <button
          onClick={handleGenerateSitemap}
          disabled={isGenerating}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          {isGenerating ? 'Generating...' : 'Generate Sitemap'}
        </button>
        
        {sitemapXml && (
          <button
            onClick={handleDownloadSitemap}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Download sitemap.xml
          </button>
        )}
        
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          {showAddForm ? 'Cancel' : 'Add URL'}
        </button>
      </div>

      {/* Add URL Form */}
      {showAddForm && (
        <form onSubmit={handleAddUrl} className="bg-gray-50 p-4 rounded-lg space-y-4">
          <h3 className="font-medium text-gray-900">Add URL to Sitemap</h3>
          
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
              URL
            </label>
            <input
              id="url"
              type="url"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="https://example.com/page"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                Priority (0.0 - 1.0)
              </label>
              <input
                id="priority"
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label htmlFor="frequency" className="block text-sm font-medium text-gray-700 mb-1">
                Change Frequency
              </label>
              <select
                id="frequency"
                value={changeFrequency}
                onChange={(e) => setChangeFrequency(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="always">Always</option>
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="never">Never</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isAdding}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isAdding ? 'Adding...' : 'Add URL'}
            </button>
          </div>
        </form>
      )}

      {/* Sitemap URLs List */}
      <div className="bg-white rounded-lg border">
        <div className="px-4 py-3 border-b bg-gray-50">
          <h3 className="font-medium text-gray-900">Sitemap URLs ({urls.length})</h3>
        </div>
        <div className="divide-y max-h-96 overflow-y-auto">
          {urls.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">
              No URLs in sitemap
            </div>
          ) : (
            urls.map((url) => (
              <div key={url.id} className="px-4 py-3 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 break-all">{url.url}</p>
                    <div className="flex space-x-4 mt-1 text-xs text-gray-500">
                      <span>Priority: {url.priority}</span>
                      <span>Frequency: {url.change_frequency}</span>
                      {!url.is_active && (
                        <span className="text-red-600">Inactive</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SitemapGenerator;