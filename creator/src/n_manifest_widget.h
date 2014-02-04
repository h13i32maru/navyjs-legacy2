#ifndef N_MANIFEST_WIDGET_H
#define N_MANIFEST_WIDGET_H

#include "n_file_widget.h"

#include <QWidget>

namespace Ui {
class NManifestWidget;
}

class NManifestWidget : public NFileWidget
{
    Q_OBJECT

public:
    explicit NManifestWidget(const QString &filePath, QWidget *parent = 0);
    ~NManifestWidget();

protected:
    virtual bool innerSave();

private:
    Ui::NManifestWidget *ui;
};

#endif // N_MANIFEST_WIDGET_H
