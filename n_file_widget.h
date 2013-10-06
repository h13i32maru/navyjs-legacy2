#ifndef N_FILE_WIDGET_H
#define N_FILE_WIDGET_H

#include <QWidget>
#include <QDir>

class NFileWidget : public QWidget
{
    Q_OBJECT
public:
    explicit NFileWidget(const QDir &projectDir, const QString &filePath, QWidget *parent = 0);
    bool isChanged();
    bool save();
    void setFilePath(const QString &filePath);
    QString filePath();
    virtual void refreshForActive();

protected:
    QDir mProjectDir;
    QString mFilePath;
    bool mChanged;
    virtual bool innerSave() = 0;

protected slots:
    void changed();

signals:
    void changed(NFileWidget *fileWidget);
};

#endif // N_FILE_WIDGET_H
