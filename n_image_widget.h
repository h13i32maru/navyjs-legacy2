#ifndef N_IMAGE_WIDGET_H
#define N_IMAGE_WIDGET_H

#include "n_file_widget.h"

#include <QLabel>

namespace Ui {
class NImageWidget;
}

class NImageWidget : public NFileWidget
{
    Q_OBJECT

public:
    explicit NImageWidget(const QDir &projectDir, const QString &filePath, QWidget *parent = 0);
    ~NImageWidget();

protected:
    virtual bool innerSave();

private:
    Ui::NImageWidget *ui;
    QLabel *mImageLabel;
};

#endif // N_IMAGE_WIDGET_H
